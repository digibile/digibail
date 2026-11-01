<?php

declare(strict_types=1);

namespace App\Security;

final class KavenegarSmsSender
{
    public function sendOtp(string $phone, string $code): bool
    {
        $apiKey = trim((string) getenv('KAVENEGAR_API_KEY'));
        $template = trim((string) getenv('KAVENEGAR_TEMPLATE'));
        $brand = trim((string) (getenv('BRAND_NAME') ?: 'دیجی‌بایل'));

        if ($apiKey === '' || $apiKey === 'YOUR_API_KEY') {
            return false;
        }

        if ($template !== '') {
            $url = 'https://api.kavenegar.com/v1/' . rawurlencode($apiKey) . '/verify/lookup.json';
            $fields = [
                'receptor' => $phone,
                'token' => $code,
                'template' => $template,
            ];
        } else {
            $url = 'https://api.kavenegar.com/v1/' . rawurlencode($apiKey) . '/sms/send.json';
            $fields = [
                'receptor' => $phone,
                'message' => $brand . ': کد تأیید شما ' . $code . ' است. این کد را در اختیار دیگران قرار ندهید.',
            ];
        }

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: application/x-www-form-urlencoded\r\nAccept: application/json\r\n",
                'content' => http_build_query($fields, '', '&', PHP_QUERY_RFC3986),
                'timeout' => 10,
                'ignore_errors' => true,
            ],
            'ssl' => [
                'verify_peer' => true,
                'verify_peer_name' => true,
            ],
        ]);

        $body = @file_get_contents($url, false, $context);
        if (!is_string($body)) {
            return false;
        }

        $status = 0;
        foreach ($http_response_header ?? [] as $header) {
            if (preg_match('/^HTTP\/\S+\s+(\d{3})/', $header, $matches) === 1) {
                $status = (int) $matches[1];
            }
        }

        if ($status !== 200) {
            return false;
        }

        try {
            $result = json_decode($body, true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return false;
        }

        return is_array($result) && (int) ($result['return']['status'] ?? 0) === 200;
    }
}
