<?php

declare(strict_types=1);

use App\Core\Loans\LoanProductRepository;

require dirname(__DIR__) . '/vendor/autoload.php';

$row = [
    'Id' => '5d8b0b12-0b4c-4f0d-8b14-88f32b2b9121',
    'Code' => 121,
    'Title' => 'خودرو سواری اقساطی',
    'PlanTitle' => 'خودرو سواری اقساطی با بازپرداخت ۳۶ ماهه',
    'PlanShortDescription' => 'طرح واقعی منتشرشده',
    'PlanHtml' => '<p onclick="alert(1)">جزئیات طرح</p>',
    'MaxAmount' => '6000000000.00',
    'MaxMonthGap' => 3,
    'AllowedInstallments' => '[{"value":12,"max":0},{"value":24,"max":0},{"value":36,"max":0}]',
    'CostsJson' => '[]',
    'ProfitPercent' => 26,
    'LoanProfitType' => 1,
];

$plan = LoanProductRepository::shapeLegacy($row);
if ($plan['id'] !== $row['Id'] || $plan['title'] !== $row['PlanTitle']) {
    throw new RuntimeException('Legacy loan plan identity and title must be preserved.');
}
if ((int) $plan['maxAmount'] !== 6000000000 || $plan['intervalMonths'] !== 36) {
    throw new RuntimeException('Legacy loan plan amount and installment terms must be preserved.');
}
if (count($plan['tiers']) !== 3 || $plan['tiers'][2]['months'] !== 36) {
    throw new RuntimeException('Legacy allowed installment options must be decoded.');
}
if ($plan['interestMethod'] !== 'legacy-type-1') {
    throw new RuntimeException('Legacy interest type must remain explicit and must not be guessed.');
}
if (str_contains($plan['fullDescriptionHtml'], 'onclick=')) {
    throw new RuntimeException('Legacy plan HTML attributes must be removed before public rendering.');
}

echo "Legacy loan plan shape tests passed.\n";
