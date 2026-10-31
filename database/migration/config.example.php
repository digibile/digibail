<?php
/**
 * Copy this file to config.php and enter the MySQL database credentials
 * created in DirectAdmin or cPanel. Never commit config.php.
 */
return [
    'mysql' => [
        'host' => 'localhost',
        'port' => 3306,
        'user' => 'digibail_vamcitydigibilepay',
        'password' => 'SET_ON_SERVER_ONLY',
        'socket' => '/var/lib/mysql/mysql.sock',
    ],
    'targets' => [
        'vamcityc_vamcity_import_20261028' => 'digibail_vamcitydigibilepay',
    ],
    'batch_size' => 500,
];
