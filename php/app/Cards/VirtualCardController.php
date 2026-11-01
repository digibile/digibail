<?php

declare(strict_types=1);

namespace App\Cards;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Security\AuthContext;
use App\Security\SecurityStore;
use App\Tenancy\TenantResolver;
use PDO;
use Throwable;

final class VirtualCardController
{
    private PDO $db;
    private CardCrypto $crypto;
    private AuthContext $auth;
    private TenantResolver $tenants;
    private SecurityStore $security;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
        $this->crypto = new CardCrypto();
        $this->auth = new AuthContext();
        $this->tenants = new TenantResolver($this->db);
        $this->security = new SecurityStore(
            $this->db,
            (string) getenv('OTP_PEPPER'),
            (string) getenv('CAPTCHA_PEPPER')
        );
    }

    public function mine(Request $request): Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود الزامی است.'], 401);
        $coreUserId = $user['core_user_id'] ?? null;
        if (!is_string($coreUserId) || $coreUserId === '') {
            return Response::json(['message' => 'شناسه مرکزی این حساب هنوز با اطلاعات قبلی تطبیق داده نشده است.'], 409);
        }

        $tenant = $this->tenants->resolve();
        $statement = $this->db->prepare(
            'SELECT * FROM VirtualCards
             WHERE TenantId = :tenant_id AND UserId = :user_id
             ORDER BY CreatedOn DESC'
        );
        $statement->execute(['tenant_id' => $tenant['id'], 'user_id' => $coreUserId]);

        return Response::json(array_map([self::class, 'dto'], $statement->fetchAll()));
    }

    public function reveal(Request $request): Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود الزامی است.'], 401);
        $coreUserId = $user['core_user_id'] ?? null;
        if (!is_string($coreUserId) || $coreUserId === '') {
            return Response::json(['message' => 'شناسه مرکزی حساب تطبیق داده نشده است.'], 409);
        }

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه کارت معتبر نیست.'], 400);

        $statement = $this->db->prepare(
            'SELECT * FROM VirtualCards
             WHERE Id = :id AND TenantId = :tenant_id AND UserId = :user_id LIMIT 1'
        );
        $statement->execute(['id' => $id, 'tenant_id' => $tenant['id'], 'user_id' => $coreUserId]);
        $card = $statement->fetch();
        if (!is_array($card)) return Response::json(['message' => 'کارت پیدا نشد.'], 404);
        if ($card['Status'] === 'Closed') return Response::json(['message' => 'کارت بسته شده است.'], 400);

        try {
            $this->insertTxn($id, 'Reveal', 0, '', '', 'نمایش اطلاعات کارت توسط مشتری');
            return Response::json([
                'number' => $this->crypto->unprotect((string) $card['PanEnc']),
                'cvv' => $this->crypto->unprotect((string) $card['CvvEnc']),
                'expiry' => sprintf('%04d/%02d', (int) $card['ExpYear'], (int) $card['ExpMonth']),
            ]);
        } catch (Throwable $exception) {
            error_log('Virtual card reveal failed: ' . $exception->getMessage());
            return Response::json(['message' => 'اطلاعات این کارت با کلید رمزنگاری فعلی قابل بازیابی نیست.'], 409);
        }
    }

    public function freeze(Request $request): Response
    {
        return $this->customerStatusChange($request, 'Frozen', 'Freeze');
    }

    public function unfreeze(Request $request): Response
    {
        return $this->customerStatusChange($request, 'Active', 'Unfreeze');
    }

    public function customerTransactions(Request $request): Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود الزامی است.'], 401);
        $coreUserId = $user['core_user_id'] ?? null;
        if (!is_string($coreUserId) || $coreUserId === '') {
            return Response::json(['message' => 'شناسه مرکزی حساب تطبیق داده نشده است.'], 409);
        }

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه کارت معتبر نیست.'], 400);
        if (!$this->cardOwnedBy($id, $tenant['id'], $coreUserId)) {
            return Response::json(['message' => 'کارت پیدا نشد.'], 404);
        }

        return Response::json($this->transactions($id, 100));
    }

    public function adminList(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        $status = trim((string) ($request->query['status'] ?? ''));
        $sql = 'SELECT * FROM VirtualCards WHERE TenantId = :tenant_id';
        $params = ['tenant_id' => $tenant['id']];
        if ($status !== '') {
            $sql .= ' AND Status = :status';
            $params['status'] = $status;
        }
        $sql .= ' ORDER BY CreatedOn DESC LIMIT 500';
        $statement = $this->db->prepare($sql);
        $statement->execute($params);
        return Response::json(array_map([self::class, 'dto'], $statement->fetchAll()));
    }

    public function issue(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;

        $loanId = (string) ($request->input['loanId'] ?? '');
        $userId = (string) ($request->input['userId'] ?? '');
        $holder = trim((string) ($request->input['holderName'] ?? ''));
        $limit = $request->input['limit'] ?? null;
        if (!self::validUuid($loanId) || !self::validUuid($userId) || $holder === ''
            || mb_strlen($holder, 'UTF-8') > 120 || !is_numeric($limit) || (float) $limit <= 0) {
            return Response::json(['message' => 'شناسه وام، کاربر، نام دارنده و سقف معتبر الزامی است.'], 400);
        }

        $tenant = $this->tenants->resolve();
        $identity = $this->db->prepare(
            'SELECT LegacyUserId FROM PhpIdentityLinks
             WHERE CoreUserId = :core_user_id AND VerifiedAt IS NOT NULL LIMIT 1'
        );
        $identity->execute(['core_user_id' => $userId]);
        if ($identity->fetchColumn() === false) {
            return Response::json(['message' => 'شناسه کاربر در پل هویت تأیید نشده است.'], 409);
        }

        try {
            return Response::json($this->issueForLoan(
                $tenant['id'],
                $loanId,
                $userId,
                $holder,
                (float) $limit
            ));
        } catch (Throwable $exception) {
            error_log('Virtual card issue failed: ' . $exception->getMessage());
            return Response::json(['message' => 'صدور کارت انجام نشد.'], 503);
        }
    }

    public function adminAction(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        $operation = (string) ($request->params['op'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه کارت معتبر نیست.'], 400);

        $status = match ($operation) {
            'freeze' => 'Frozen',
            'unfreeze' => 'Active',
            'close' => 'Closed',
            default => null,
        };
        if ($status === null) return Response::json(['message' => 'عملیات کارت معتبر نیست.'], 404);

        $this->db->beginTransaction();
        try {
            $statement = $this->db->prepare(
                'SELECT Status FROM VirtualCards
                 WHERE Id = :id AND TenantId = :tenant_id FOR UPDATE'
            );
            $statement->execute(['id' => $id, 'tenant_id' => $tenant['id']]);
            $current = $statement->fetchColumn();
            if ($current === false) {
                $this->db->commit();
                return Response::json(['message' => 'کارت پیدا نشد.'], 404);
            }
            if ($current === 'Closed') {
                $this->db->commit();
                return Response::json(['message' => 'کارت بسته شده است.'], 400);
            }

            $this->db->prepare(
                'UPDATE VirtualCards SET Status = :status WHERE Id = :id AND TenantId = :tenant_id'
            )->execute(['status' => $status, 'id' => $id, 'tenant_id' => $tenant['id']]);
            $this->insertTxn($id, ucfirst($operation), 0, '', '', 'تغییر وضعیت توسط مدیر');
            $this->db->commit();

            return Response::json($this->findCardDto($id));
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Virtual card admin action failed: ' . $exception->getMessage());
            return Response::json(['message' => 'عملیات کارت انجام نشد.'], 503);
        }
    }

    public function adminLimit(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        $limit = $request->input['limit'] ?? null;
        $perTxn = $request->input['perTxnLimit'] ?? null;
        if (!self::validUuid($id) || !is_numeric($limit) || (float) $limit <= 0
            || ($perTxn !== null && (!is_numeric($perTxn) || (float) $perTxn <= 0 || (float) $perTxn > (float) $limit))) {
            return Response::json(['message' => 'سقف کارت یا سقف هر تراکنش معتبر نیست.'], 400);
        }

        $this->db->beginTransaction();
        try {
            $query = $this->db->prepare(
                'SELECT Spent, PerTxnLimit FROM VirtualCards
                 WHERE Id = :id AND TenantId = :tenant_id FOR UPDATE'
            );
            $query->execute(['id' => $id, 'tenant_id' => $tenant['id']]);
            $cardLimits = $query->fetch();
            if (!is_array($cardLimits)) {
                $this->db->commit();
                return Response::json(['message' => 'کارت پیدا نشد.'], 404);
            }
            if ((float) $limit < (float) $cardLimits['Spent']) {
                $this->db->commit();
                return Response::json(['message' => 'سقف جدید نمی‌تواند کمتر از مبلغ مصرف‌شده باشد.'], 400);
            }

            $update = $this->db->prepare(
                'UPDATE VirtualCards
                 SET `Limit` = :limit, PerTxnLimit = :per_txn
                 WHERE Id = :id AND TenantId = :tenant_id'
            );
            $update->execute([
                'limit' => (float) $limit,
                'per_txn' => $perTxn === null ? (float) $cardLimits['PerTxnLimit'] : (float) $perTxn,
                'id' => $id,
                'tenant_id' => $tenant['id'],
            ]);
            $this->insertTxn($id, 'LimitChange', (float) $limit, '', '', 'تغییر سقف توسط مدیر');
            $this->db->commit();
            return Response::json($this->findCardDto($id));
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Virtual card limit update failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تغییر سقف کارت انجام نشد.'], 503);
        }
    }

    public function adminTransactions(Request $request): Response
    {
        $denied = $this->adminGuard($request);
        if ($denied !== null) return $denied;
        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه کارت معتبر نیست.'], 400);
        $query = $this->db->prepare('SELECT 1 FROM VirtualCards WHERE Id = :id AND TenantId = :tenant_id LIMIT 1');
        $query->execute(['id' => $id, 'tenant_id' => $tenant['id']]);
        if ($query->fetchColumn() === false) return Response::json(['message' => 'کارت پیدا نشد.'], 404);
        return Response::json($this->transactions($id, 200));
    }

    public function charge(Request $request): Response
    {
        $keys = array_values(array_filter(array_map('trim', explode(',', (string) getenv('GATEWAY_MERCHANT_KEYS')))));
        if ($keys === []) return Response::json(['message' => 'کلید پذیرنده تنظیم نشده است.'], 503);

        if (!$this->security->hitRateLimit('gateway:ip:' . $this->clientIp(), 60, 60)) {
            return Response::json(['status' => 'failed', 'message' => 'درخواست‌ها بیش از حد مجاز است.'], 429);
        }

        $given = (string) ($request->headers['x-merchant-key'] ?? '');
        $validKey = false;
        foreach ($keys as $key) {
            if (hash_equals($key, $given)) $validKey = true;
        }
        if (!$validKey) return Response::json(['message' => 'کلید پذیرنده نامعتبر است.'], 401);

        $pan = preg_replace('/\D+/', '', (string) ($request->input['cardNumber'] ?? '')) ?? '';
        $cvv = (string) ($request->input['cvv'] ?? '');
        $expiry = trim((string) ($request->input['expiry'] ?? ''));
        $amount = $request->input['amount'] ?? null;
        $orderId = trim((string) ($request->input['orderId'] ?? ''));
        $merchant = mb_substr(trim((string) ($request->input['merchantName'] ?? '')), 0, 120, 'UTF-8');

        if (!CardCrypto::validPan($pan) || preg_match('/^\d{3}$/D', $cvv) !== 1
            || !is_numeric($amount) || (float) $amount <= 0 || $orderId === '' || strlen($orderId) > 80
            || preg_match('/^\d{4}\/\d{2}$/D', $expiry) !== 1) {
            return Response::json(['status' => 'failed', 'message' => 'اطلاعات پرداخت معتبر نیست.'], 400);
        }

        $panHash = $this->crypto->hash($pan);
        $failureBucket = 'gateway:card-failure:' . $panHash;
        if ($this->security->isRateLimited($failureBucket, 5, 900)) {
            return Response::json(['status' => 'failed', 'message' => 'به دلیل تلاش‌های ناموفق، کارت موقتاً مسدود شده است.'], 429);
        }

        $this->db->beginTransaction();
        try {
            $query = $this->db->prepare(
                'SELECT * FROM VirtualCards WHERE PanHash = :pan_hash LIMIT 1 FOR UPDATE'
            );
            $query->execute(['pan_hash' => $panHash]);
            $card = $query->fetch();

            if (!is_array($card)) {
                $this->db->commit();
                $this->security->hitRateLimit($failureBucket, 5, 900);
                return Response::json(['status' => 'failed', 'message' => 'کارت یا اطلاعات آن نامعتبر است.'], 400);
            }

            $expectedExpiry = sprintf('%04d/%02d', (int) $card['ExpYear'], (int) $card['ExpMonth']);
            $now = new \DateTimeImmutable('now', new \DateTimeZone('UTC'));
            $expiryDate = \DateTimeImmutable::createFromFormat('!Y/m', $expiry, new \DateTimeZone('UTC'));
            $isExpired = !$expiryDate || $expiryDate < $now->modify('first day of this month');
            try {
                $cvvMatches = hash_equals($this->crypto->unprotect((string) $card['CvvEnc']), $cvv);
            } catch (Throwable) {
                $cvvMatches = false;
            }

            if (!hash_equals($expectedExpiry, $expiry) || !$cvvMatches || $isExpired) {
                $this->db->commit();
                $this->security->hitRateLimit($failureBucket, 5, 900);
                return Response::json(['status' => 'failed', 'message' => 'کارت یا اطلاعات آن نامعتبر است.'], 400);
            }
            if ($card['Status'] !== 'Active') {
                $this->db->commit();
                return Response::json(['status' => 'failed', 'message' => 'کارت فعال نیست.'], 400);
            }

            $duplicate = $this->db->prepare(
                'SELECT 1 FROM VirtualCardTxns
                 WHERE CardId = :card_id AND Reference = :reference AND Type = :type LIMIT 1'
            );
            $duplicate->execute(['card_id' => $card['Id'], 'reference' => $orderId, 'type' => 'Charge']);
            if ($duplicate->fetchColumn() !== false) {
                $this->db->commit();
                return Response::json(['status' => 'failed', 'message' => 'این سفارش قبلاً پرداخت شده است.'], 409);
            }

            $amountValue = (float) $amount;
            if ($amountValue > (float) $card['PerTxnLimit'] || (float) $card['Spent'] + $amountValue > (float) $card['Limit']) {
                $this->db->commit();
                return Response::json(['status' => 'failed', 'message' => 'اعتبار کارت کافی نیست.'], 400);
            }

            $update = $this->db->prepare(
                'UPDATE VirtualCards SET Spent = Spent + :amount
                 WHERE Id = :id AND Status = :status
                   AND Spent + :amount_check <= `Limit`'
            );
            $update->execute([
                'amount' => $amountValue,
                'id' => $card['Id'],
                'status' => 'Active',
                'amount_check' => $amountValue,
            ]);
            if ($update->rowCount() !== 1) {
                $this->db->rollBack();
                return Response::json(['status' => 'failed', 'message' => 'اعتبار کارت کافی نیست.'], 400);
            }

            $txnId = $this->insertTxn($card['Id'], 'Charge', $amountValue, $merchant, $orderId, '');
            $this->db->commit();

            $remaining = (float) $card['Limit'] - ((float) $card['Spent'] + $amountValue);
            return Response::json([
                'status' => 'paid',
                'refId' => 'GH-' . strtoupper(substr(str_replace('-', '', $txnId), 0, 8)),
                'amount' => $amountValue,
                'remaining' => $remaining,
            ]);
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Virtual card gateway charge failed: ' . $exception->getMessage());
            return Response::json(['status' => 'failed', 'message' => 'پرداخت در حال حاضر انجام نشد.'], 503);
        }
    }

    private function customerStatusChange(Request $request, string $status, string $type): Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود الزامی است.'], 401);
        $coreUserId = $user['core_user_id'] ?? null;
        if (!is_string($coreUserId) || $coreUserId === '') return Response::json(['message' => 'شناسه مرکزی حساب تطبیق داده نشده است.'], 409);

        $tenant = $this->tenants->resolve();
        $id = (string) ($request->params['id'] ?? '');
        if (!self::validUuid($id)) return Response::json(['message' => 'شناسه کارت معتبر نیست.'], 400);

        $this->db->beginTransaction();
        try {
            $query = $this->db->prepare(
                'SELECT Status FROM VirtualCards
                 WHERE Id = :id AND TenantId = :tenant_id AND UserId = :user_id FOR UPDATE'
            );
            $query->execute(['id' => $id, 'tenant_id' => $tenant['id'], 'user_id' => $coreUserId]);
            $current = $query->fetchColumn();
            if ($current === false) {
                $this->db->commit();
                return Response::json(['message' => 'کارت پیدا نشد.'], 404);
            }
            if ($current === 'Closed') {
                $this->db->commit();
                return Response::json(['message' => 'کارت بسته شده است.'], 400);
            }

            $this->db->prepare(
                'UPDATE VirtualCards SET Status = :status WHERE Id = :id'
            )->execute(['status' => $status, 'id' => $id]);
            $this->insertTxn($id, $type, 0, '', '', '');
            $this->db->commit();
            return Response::json($this->findCardDto($id));
        } catch (Throwable $exception) {
            if ($this->db->inTransaction()) $this->db->rollBack();
            error_log('Virtual card customer status change failed: ' . $exception->getMessage());
            return Response::json(['message' => 'تغییر وضعیت کارت انجام نشد.'], 503);
        }
    }

    private function issueForLoan(string $tenantId, string $loanId, string $userId, string $holderName, float $limit): array
    {
        $lockName = 'php_card_' . substr(hash('sha256', $tenantId . ':' . $loanId), 0, 48);
        $lock = $this->db->prepare('SELECT GET_LOCK(:lock_name, 5)');
        $lock->execute(['lock_name' => $lockName]);
        if ((int) $lock->fetchColumn() !== 1) throw new \RuntimeException('Could not lock card issuance.');

        try {
            $existing = $this->db->prepare(
                'SELECT * FROM VirtualCards
                 WHERE TenantId = :tenant_id AND LoanId = :loan_id AND Status <> :closed
                 ORDER BY CreatedOn DESC LIMIT 1'
            );
            $existing->execute(['tenant_id' => $tenantId, 'loan_id' => $loanId, 'closed' => 'Closed']);
            $card = $existing->fetch();
            if (is_array($card)) return self::dto($card);

            $pan = $this->crypto->newPan();
            $panHash = $this->crypto->hash($pan);
            $collision = $this->db->prepare('SELECT 1 FROM VirtualCards WHERE PanHash = :hash LIMIT 1');
            $collision->execute(['hash' => $panHash]);
            while ($collision->fetchColumn() !== false) {
                $pan = $this->crypto->newPan();
                $panHash = $this->crypto->hash($pan);
                $collision->execute(['hash' => $panHash]);
            }

            $cvv = (string) random_int(100, 999);
            $validMonths = max(1, min(120, (int) (getenv('CARDS_VALID_MONTHS') ?: 36)));
            $expiry = (new \DateTimeImmutable('now', new \DateTimeZone('UTC')))->modify('+' . $validMonths . ' months');
            $id = self::uuid();
            $insert = $this->db->prepare(
                'INSERT INTO VirtualCards (
                    Id, TenantId, LoanId, UserId, HolderName, Last4, Bin, PanHash,
                    PanEnc, CvvEnc, ExpMonth, ExpYear, `Limit`, Spent, PerTxnLimit,
                    Status, CreatedOn
                 ) VALUES (
                    :id, :tenant_id, :loan_id, :user_id, :holder, :last4, :bin, :pan_hash,
                    :pan_enc, :cvv_enc, :exp_month, :exp_year, :card_limit, 0, :per_txn,
                    :status, UTC_TIMESTAMP(6)
                 )'
            );
            $insert->execute([
                'id' => $id,
                'tenant_id' => $tenantId,
                'loan_id' => $loanId,
                'user_id' => $userId,
                'holder' => $holderName,
                'last4' => substr($pan, -4),
                'bin' => $this->crypto->binPrefix(),
                'pan_hash' => $panHash,
                'pan_enc' => $this->crypto->protect($pan),
                'cvv_enc' => $this->crypto->protect($cvv),
                'exp_month' => (int) $expiry->format('n'),
                'exp_year' => (int) $expiry->format('Y'),
                'card_limit' => $limit,
                'per_txn' => $limit,
                'status' => 'Active',
            ]);

            $this->insertTxn($id, 'Issue', $limit, '', '', 'صدور خودکار برای وام');
            $query = $this->db->prepare('SELECT * FROM VirtualCards WHERE Id = :id LIMIT 1');
            $query->execute(['id' => $id]);
            $created = $query->fetch();
            if (!is_array($created)) throw new \RuntimeException('Issued card could not be reloaded.');
            return self::dto($created);
        } finally {
            $release = $this->db->prepare('SELECT RELEASE_LOCK(:lock_name)');
            $release->execute(['lock_name' => $lockName]);
        }
    }

    /** @return list<array<string,mixed>> */
    private function transactions(string $cardId, int $limit): array
    {
        $statement = $this->db->prepare(
            'SELECT Id, CardId, Type, Amount, Merchant, Reference, Note, CreatedOn
             FROM VirtualCardTxns WHERE CardId = :card_id
             ORDER BY CreatedOn DESC LIMIT ' . max(1, min(200, $limit))
        );
        $statement->execute(['card_id' => $cardId]);
        return $statement->fetchAll();
    }

    private function cardOwnedBy(string $id, string $tenantId, string $userId): bool
    {
        $statement = $this->db->prepare(
            'SELECT 1 FROM VirtualCards
             WHERE Id = :id AND TenantId = :tenant_id AND UserId = :user_id LIMIT 1'
        );
        $statement->execute(['id' => $id, 'tenant_id' => $tenantId, 'user_id' => $userId]);
        return $statement->fetchColumn() !== false;
    }

    private function findCardDto(string $id): array
    {
        $statement = $this->db->prepare('SELECT * FROM VirtualCards WHERE Id = :id LIMIT 1');
        $statement->execute(['id' => $id]);
        $row = $statement->fetch();
        return is_array($row) ? self::dto($row) : [];
    }

    private function insertTxn(string $cardId, string $type, float $amount, string $merchant, string $reference, string $note): string
    {
        $id = self::uuid();
        $statement = $this->db->prepare(
            'INSERT INTO VirtualCardTxns (Id, CardId, Type, Amount, Merchant, Reference, Note, CreatedOn)
             VALUES (:id, :card_id, :type, :amount, :merchant, :reference, :note, UTC_TIMESTAMP(6))'
        );
        $statement->execute([
            'id' => $id,
            'card_id' => $cardId,
            'type' => $type,
            'amount' => $amount,
            'merchant' => mb_substr($merchant, 0, 120, 'UTF-8'),
            'reference' => mb_substr($reference, 0, 80, 'UTF-8'),
            'note' => mb_substr($note, 0, 200, 'UTF-8'),
        ]);
        return $id;
    }

    private function adminGuard(Request $request): ?Response
    {
        $user = $this->auth->user($request);
        if ($user === null) return Response::json(['message' => 'ورود مدیر لازم است.'], 401);
        if (!$this->auth->hasAnyRole($user, ['Admin', 'SuperAdmin'])) {
            return Response::json(['message' => 'دسترسی مدیر لازم است.'], 403);
        }
        return null;
    }

    private function clientIp(): string
    {
        $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
        if (in_array($remote, ['127.0.0.1', '::1'], true)) {
            $forwarded = trim(explode(',', (string) ($_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['HTTP_X_FORWARDED_FOR'] ?? ''))[0]);
            if (filter_var($forwarded, FILTER_VALIDATE_IP) !== false) return $forwarded;
        }
        return filter_var($remote, FILTER_VALIDATE_IP) !== false ? $remote : 'unknown';
    }

    /** @param array<string,mixed> $card
     *  @return array<string,mixed>
     */
    public static function dto(array $card): array
    {
        return [
            'id' => (string) $card['Id'],
            'loanId' => (string) $card['LoanId'],
            'holderName' => (string) $card['HolderName'],
            'number' => (string) $card['Bin'] . ' •••• •••• ' . (string) $card['Last4'],
            'expiry' => sprintf('%04d/%02d', (int) $card['ExpYear'], (int) $card['ExpMonth']),
            'limit' => (float) $card['Limit'],
            'spent' => (float) $card['Spent'],
            'remaining' => (float) $card['Limit'] - (float) $card['Spent'],
            'perTxnLimit' => (float) $card['PerTxnLimit'],
            'status' => (string) $card['Status'],
            'createdOn' => (string) $card['CreatedOn'],
        ];
    }

    private static function validUuid(string $value): bool
    {
        return preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iD', $value) === 1;
    }

    private static function uuid(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
        $hex = bin2hex($bytes);
        return substr($hex, 0, 8) . '-' . substr($hex, 8, 4) . '-' . substr($hex, 12, 4)
            . '-' . substr($hex, 16, 4) . '-' . substr($hex, 20);
    }
}
