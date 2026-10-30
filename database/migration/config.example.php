<?php
/**
 * Copy this file to config.php and enter the MySQL database credentials
 * created in DirectAdmin or cPanel. Never commit config.php.
 */
return [
    'mysql' => [
        'host' => 'localhost',
        'port' => 3306,
        'user' => 'YOUR_DATABASE_USER',
        'password' => 'YOUR_DATABASE_PASSWORD',
        'socket' => '/var/lib/mysql/mysql.sock',
    ],
    'batch_size' => 500,
];
