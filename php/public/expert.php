<?php

declare(strict_types=1);

use App\Core\Environment;
use App\Core\Http\Request;
use App\Security\AuthContext;

$appRoot = dirname(__DIR__);
require $appRoot . '/vendor/autoload.php';
Environment::load($appRoot . '/.env');

header('Cache-Control: no-store, private, max-age=0');
header('Pragma: no-cache');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('Referrer-Policy: same-origin');
header('X-Robots-Tag: noindex, nofollow');

$request = Request::fromGlobals();
$auth = new AuthContext();
$user = $auth->user($request);

if ($user === null) {
    header('Location: /login.html?next=%2Fexpert.php', true, 302);
    exit;
}

if (!$auth->hasAnyRole($user, ['Admin'])) {
    http_response_code(403);
    header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>عدم دسترسی</title><body style="font-family:Tahoma,sans-serif;background:#f5f6fa;color:#20243a;padding:48px;text-align:center"><h1>دسترسی مجاز نیست</h1><p>این میزکار فقط برای حساب‌های دارای مجوز مدیریت در دسترس است.</p><a href="/login.html">بازگشت به ورود</a></body></html>';
    exit;
}

require $appRoot . '/views/expert-dashboard.html';
