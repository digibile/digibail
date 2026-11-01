<?php

declare(strict_types=1);

namespace App\Core\Loans;

use App\Core\Database\ConnectionFactory;
use App\Core\Http\Request;
use App\Core\Http\Response;
use App\Security\AuthContext;
use PDO;

final class VamCityLoanRequestController
{
    private PDO $db;
    private AuthContext $auth;

    public function __construct()
    {
        $this->db = ConnectionFactory::create();
        $this->auth = new AuthContext();
    }

    public function list(Request $request): Response
    {
        $user = $this->auth->user($request);
        if ($user === null) {
            return Response::json(['message' => 'برای مشاهده درخواست‌های وام وارد حساب شوید.'], 401);
        }
        if (!$this->auth->hasAnyRole($user, ['Admin', 'SuperAdmin'])) {
            return Response::json(['message' => 'دسترسی مدیر سامانه لازم است.'], 403);
        }

        $page = max(1, min(100000, (int) ($request->query['page'] ?? 1)));
        $pageSize = max(10, min(250, (int) ($request->query['pageSize'] ?? 25)));
        $search = trim((string) ($request->query['q'] ?? ''));
        $search = mb_substr($search, 0, 120, 'UTF-8');
        $status = mb_substr(trim((string) ($request->query['status'] ?? '')), 0, 120, 'UTF-8');
        $from = trim((string) ($request->query['from'] ?? ''));
        $to = trim((string) ($request->query['to'] ?? ''));
        $where = [];
        $params = [];

        if ($search !== '') {
            $where[] = '(CAST(r.Id AS CHAR) LIKE :search_id OR CAST(r.Code AS CHAR) LIKE :search_code
                OR COALESCE(u.FirstName, \'\') LIKE :search_first
                OR COALESCE(u.LastName, \'\') LIKE :search_last
                OR COALESCE(u.Mobile, u.Phone, u.PhoneNumber, \'\') LIKE :search_mobile
                OR COALESCE(u.NationalCode, \'\') LIKE :search_national
                OR COALESCE(l.Title, \'\') LIKE :search_loan)';
            $needle = '%' . $search . '%';
            foreach (['search_id', 'search_code', 'search_first', 'search_last', 'search_mobile', 'search_national', 'search_loan'] as $key) {
                $params[$key] = $needle;
            }
        }
        if ($status !== '') {
            $where[] = '(r.StatusId = :status_id OR r.AgentStatusId = :status_agent OR s.Title = :status_title)';
            $params['status_id'] = $status;
            $params['status_agent'] = $status;
            $params['status_title'] = $status;
        }
        if (preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $from) === 1 && self::validDate($from)) {
            $where[] = 'r.RequestDate >= :from_date';
            $params['from_date'] = $from . ' 00:00:00';
        }
        if (preg_match('/^\\d{4}-\\d{2}-\\d{2}$/', $to) === 1 && self::validDate($to)) {
            $where[] = 'r.RequestDate < DATE_ADD(:to_date, INTERVAL 1 DAY)';
            $params['to_date'] = $to . ' 00:00:00';
        }

        $from = ' FROM UserLoanRequests r
            LEFT JOIN AspNetUsers u ON u.Id = r.UserId
            LEFT JOIN Loans l ON l.Id = r.LoanId
            LEFT JOIN LoanRequestStatuses s ON s.Id = r.StatusId
            LEFT JOIN AspNetUsers agent ON agent.Id = r.AgentId';
        $filter = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $count = $this->db->prepare('SELECT COUNT(*)' . $from . $filter);
        $count->execute($params);
        $total = (int) $count->fetchColumn();

        $rowsSql = 'SELECT
                r.Id AS id,
                r.Code AS code,
                CAST(r.UserId AS CHAR) AS userId,
                r.CustomerId AS customerId,
                r.LoanId AS loanId,
                COALESCE(l.Title, \'طرح ثبت‌شده در سامانه\') AS loanName,
                CONCAT_WS(\' \', NULLIF(u.FirstName, \'\'), NULLIF(u.LastName, \'\')) AS applicantName,
                COALESCE(u.Mobile, u.Phone, u.PhoneNumber) AS mobile,
                u.NationalCode AS nationalCode,
                CONCAT_WS(' ', NULLIF(agent.FirstName, ''), NULLIF(agent.LastName, '')) AS agentName,
                r.Amount AS amount,
                r.Installment AS installment,
                r.InstallmentCount AS installmentCount,
                r.Month AS month,
                r.Year AS year,
                r.RequestDate AS requestDate,
                r.__raw_RequestDate AS requestDateRaw,
                r.StatusId AS statusId,
                s.Title AS status,
                r.AgentStatusId AS agentStatusId,
                r.AgentId AS agentId,
                r.Comment AS comment,
                r.AdminDescription AS adminDescription,
                r.AdminDescriptionPrivate AS adminDescriptionPrivate,
                r.IsPhysicalDocsDelivered AS physicalDocumentsDelivered
            ' . $from . $filter . '
            ORDER BY r.RequestDate DESC, r.Code DESC
            LIMIT :row_limit OFFSET :row_offset';
        $rows = $this->db->prepare($rowsSql);
        foreach ($params as $key => $value) {
            $rows->bindValue(':' . $key, $value, PDO::PARAM_STR);
        }
        $rows->bindValue(':row_limit', $pageSize, PDO::PARAM_INT);
        $rows->bindValue(':row_offset', ($page - 1) * $pageSize, PDO::PARAM_INT);
        $rows->execute();

        $summaryStatement = $this->db->query(
            'SELECT
                COUNT(*) AS total,
                SUM(CASE WHEN s.Title IS NULL OR LOWER(s.Title) REGEXP \'new|pending|در انتظار|جدید|ثبت\' THEN 1 ELSE 0 END) AS pending,
                SUM(CASE WHEN LOWER(COALESCE(s.Title, \'\')) REGEXP \'approve|تایید|تأیید|پذیرش\' THEN 1 ELSE 0 END) AS approved,
                SUM(CASE WHEN LOWER(COALESCE(s.Title, \'\')) REGEXP \'reject|رد|لغو|cancel\' THEN 1 ELSE 0 END) AS rejected,
                SUM(CASE WHEN DATE(r.RequestDate) = CURRENT_DATE() THEN 1 ELSE 0 END) AS today
             FROM UserLoanRequests r
             LEFT JOIN LoanRequestStatuses s ON s.Id = r.StatusId'
        );
        $summary = $summaryStatement->fetch() ?: [];

        $statusStatement = $this->db->query(
            'SELECT s.Id AS id, s.Title AS status, COUNT(*) AS count
             FROM UserLoanRequests r
             LEFT JOIN LoanRequestStatuses s ON s.Id = r.StatusId
             WHERE s.Title IS NOT NULL AND s.Title <> \'\'
             GROUP BY s.Id, s.Title
             ORDER BY count DESC, s.Title
             LIMIT 100'
        );

        return Response::json([
            'data' => [
                'rows' => $rows->fetchAll(),
                'total' => $total,
                'page' => $page,
                'pageSize' => $pageSize,
                'summary' => [
                    'total' => (int) ($summary['total'] ?? 0),
                    'pending' => (int) ($summary['pending'] ?? 0),
                    'approved' => (int) ($summary['approved'] ?? 0),
                    'rejected' => (int) ($summary['rejected'] ?? 0),
                    'today' => (int) ($summary['today'] ?? 0),
                ],
                'statuses' => $statusStatement->fetchAll(),
                'source' => 'MariaDB.UserLoanRequests',
            ],
        ]);
    }

    private static function validDate(string $value): bool
    {
        [$year, $month, $day] = array_map('intval', explode('-', $value));
        return checkdate($month, $day, $year);
    }
}
