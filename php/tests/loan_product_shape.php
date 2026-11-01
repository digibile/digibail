<?php

declare(strict_types=1);

use App\Core\Loans\LoanProductRepository;

require dirname(__DIR__) . '/vendor/autoload.php';

$row = [
    'Slug' => 'p3',
    'Name' => 'اقساط سه ماهه',
    'Description' => 'طرح آزمایشی',
    'Badge' => 'جدید',
    'IsActive' => 1,
    'MinAmount' => '1000000.00',
    'MaxAmount' => '20000000.00',
    'IntervalDays' => 90,
    'TiersJson' => '[{"months":3,"feePercent":2,"downPaymentPercent":0}]',
    'ConditionsJson' => '{"minAge":22,"maxAge":60}',
    'DocumentsJson' => '[{"name":"کارت ملی","required":true}]',
    'Title' => '',
    'ImageUrl' => '/uploads/plans/sample.webp',
    'FullDescriptionHtml' => '<p>متن</p>',
    'LabelsJson' => '["سریع","آنلاین"]',
    'OperationalCostsJson' => '[{"title":"کارمزد","percent":2}]',
    'InterestMethod' => 'Monthly',
    'InterestPercent' => '2.500000',
    'LateDailyCoef' => '0.00080000',
    'EarlyDailyCoef' => '0.00000000',
    'ShowInList' => 1,
    'SendReminders' => 1,
];

$shape = LoanProductRepository::shape($row);

if (($shape['id'] ?? null) !== 'p3' || ($shape['title'] ?? null) !== 'اقساط سه ماهه') {
    throw new RuntimeException('Loan product identity and fallback title must be shaped correctly.');
}
if (($shape['intervalMonths'] ?? null) !== 3 || ($shape['intervalDays'] ?? null) !== 90) {
    throw new RuntimeException('Loan interval compatibility fields must preserve days and derive months.');
}
if (($shape['tiers'][0]['months'] ?? null) !== 3 || ($shape['conditions']['minAge'] ?? null) !== 22) {
    throw new RuntimeException('Loan product JSON fields must be decoded.');
}
if (($shape['showInList'] ?? false) !== true || ($shape['sendReminders'] ?? false) !== true) {
    throw new RuntimeException('Loan product visibility and reminder flags must be booleans.');
}

echo "Loan product shape tests passed.\n";
