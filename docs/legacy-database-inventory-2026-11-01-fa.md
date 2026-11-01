# فهرست مستند پایگاه‌های داده قدیمی دیجی‌بایل

تاریخ برداشت: ۱ نوامبر ۲۰۲۶. منبع: SQL Server روی سرور، کانتینر `public_html-db-1`. این گزارش فقط فراداده ساختاری و شمارنده‌های رکورد را ثبت می‌کند؛ هیچ ردیف شخصی، رمز، شماره تماس یا مقدار محرمانه‌ای استخراج نشده است. عملیات فقط خواندنی بوده و هیچ داده یا ساختاری تغییر نکرده است.

## پایگاه‌های شناسایی‌شده

| پایگاه داده | جدول | ستون | کلید خارجی | کلید اصلی | توضیح |
|---|---:|---:|---:|---:|---|
| `Digibail` | 59 | 614 | 104 | 59 | دیتابیس اصلی برنامه |
| `vamcityc_bluvamdb_import_20261028` | 56 | 573 | 99 | 56 | نسخه واردشده BlueVam |
| `vamcityc_transferDb_import_20261028` | 12 | 78 | 8 | 12 | نسخه واردشده انتقال وجه |
| `vamcityc_vamcity_import_20261028` | 88 | 957 | 188 | 88 | نسخه واردشده VamCity |

مجموع چهار پایگاه: **۲۱۵ جدول، ۲٬۲۲۲ ستون، ۳۹۹ کلید خارجی و ۲۱۵ کلید اصلی**. این اعداد از خروجی زنده کاتالوگ SQL Server استخراج شده‌اند.

## Digibail

### TABLE ROW COUNTS

```text
schema_name table_name row_count
----------- ---------- ---------
dbo __EFMigrationsHistory 152
dbo AffiliateCommissions 0
dbo AgentLoanAuthorizationItem 0
dbo AgentLoans 0
dbo AgentMetaData 0
dbo AppSettings 0
dbo AppSms 0
dbo AspNetRoleClaims 0
dbo AspNetRoles 6
dbo AspNetUserClaims 23
dbo AspNetUserLogins 0
dbo AspNetUserRoles 2
dbo AspNetUsers 2
dbo AspNetUserTokens 0
dbo Assurance 0
dbo AuthorizationItem 0
dbo Consultants 0
dbo Contacts 0
dbo CustomerMarketerCommissions 0
dbo CustomerPurchasePlan 1
dbo Customers 1
dbo Expenses 0
dbo IceReport 0
dbo IranValidityReport 0
dbo LoanAuthorizationItems 0
dbo LoanContacts 0
dbo LoanRequestStatuses 10
dbo Loans 0
dbo MemberPurchases 0
dbo OffDate 0
dbo OnlineMoneyTransfer 0
dbo Purchases 0
dbo SmsPatterns 4
dbo SubAgentTransactions 0
dbo ThirdPartySettings 0
dbo ThirdPartyTransfer 0
dbo UserLoanContact 0
dbo UserLoanPaymentRequests 0
dbo UserLoanPayments 0
dbo UserLoanRequestAuthorizationItemAttachments 0
dbo UserLoanRequestAuthorizationItems 0
dbo UserLoanRequests 0
dbo UserLoanRequestStatusHistories 0
dbo UserLoans 0
dbo UserLoanSponsoreDueDate 0
dbo UserSavedMonies 0
dbo VisitorLogs 0
dbo Withdraws 0
HangFire AggregatedCounter 0
HangFire Counter 0
HangFire Hash 0
HangFire Job 0
HangFire JobParameter 0
HangFire JobQueue 0
HangFire List 0
HangFire Schema 1
HangFire Server 1
HangFire Set 0
HangFire State 0
```

### ALL COLUMNS

```text
schema_name table_name column_id column_name data_type max_length precision scale is_nullable is_identity default_definition
----------- ---------- --------- ----------- --------- ---------- --------- ----- ----------- ----------- ------------------
dbo __EFMigrationsHistory 1 MigrationId nvarchar 300 0 0 0 0 NULL
dbo __EFMigrationsHistory 2 ProductVersion nvarchar 64 0 0 0 0 NULL
dbo AffiliateCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AffiliateCommissions 2 Amount int 4 10 0 0 0 NULL
dbo AffiliateCommissions 3 PaidToUser int 4 10 0 0 0 NULL
dbo AffiliateCommissions 4 Date datetime2 8 27 7 0 0 NULL
dbo AffiliateCommissions 5 Description nvarchar 1000 0 0 1 0 NULL
dbo AffiliateCommissions 6 UserId bigint 8 19 0 0 0 NULL
dbo AffiliateCommissions 7 PurchaseId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 2 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 2 AgentId bigint 8 19 0 0 0 NULL
dbo AgentLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 4 Percent decimal 9 18 2 0 0 NULL
dbo AgentLoans 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 6 DefaultCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 7 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo AgentLoans 8 ContactPercent decimal 9 18 2 0 0 NULL
dbo AgentLoans 11 ProductCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 12 ProductPercent decimal 9 18 2 0 0 ((0.0))
dbo AgentMetaData 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentMetaData 2 SignaturesOwnerNames nvarchar 400 0 0 1 0 NULL
dbo AgentMetaData 3 ShomareSabt nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 4 ShenaseMelli nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 5 CompanyName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 6 AgentCategoryActivities nvarchar 400 0 0 1 0 NULL
dbo AgentMetaData 7 AgentType int 4 10 0 0 0 NULL
dbo AgentMetaData 8 UserId bigint 8 19 0 0 0 NULL
dbo AgentMetaData 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentMetaData 10 Status int 4 10 0 0 0 NULL
dbo AgentMetaData 11 RejectReason nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 12 LastAdminChangeDateTime datetime2 8 27 7 0 0 NULL
dbo AgentMetaData 13 CheckedBy nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 14 ThumbnailFileName nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 15 JavazKasbFileName nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 16 KartMelliFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 17 EjarenameFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 18 AsasnameFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 19 RoznameRasmiFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 20 IsOnline bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AgentMetaData 21 IsPhysical bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AgentMetaData 22 SiteUrl nvarchar 200 0 0 1 0 NULL
dbo AppSettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSettings 5 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo AppSettings 6 IsOnlinePaymentActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 7 OnlinePaymentGateway int 4 10 0 0 0 ((0))
dbo AppSettings 8 Shaba nvarchar 100 0 0 1 0 NULL
dbo AppSettings 9 ZarinpalMerchantCode nvarchar 400 0 0 1 0 NULL
dbo AppSettings 10 DueDateRememberSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 11 DueDatedRememberSmsTime time 5 16 7 1 0 NULL
dbo AppSettings 12 SmsCredit int 4 10 0 0 0 ((0))
dbo AppSettings 13 ThanksPaymentSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 14 AppendToWhichInstallment int 4 10 0 0 0 ((0))
dbo AppSettings 15 RoundCountNumber tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AppSettings 16 OverDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 17 OverDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 18 SepTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 19 DashboardSettingsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 20 BeforeDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 21 IsDueDateSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 22 IsRememberSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 23 OverDueDayRemeberOnce bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 24 BeforeDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 25 DefaultSmsPanel int 4 10 0 0 0 ((0))
dbo AppSettings 26 MelliPayamakConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 27 KaveNegarConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 28 BankInfo nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 29 IceConfigJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 30 NextPayApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 31 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 32 IPGParsianLoginAccount nvarchar 400 0 0 1 0 NULL
dbo AppSettings 33 Address nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 34 Email nvarchar -1 0 0 1 0 NULL
dbo AppSettings 35 Phones nvarchar 400 0 0 1 0 NULL
dbo AppSettings 36 ThemeSettingsJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 37 DepositChargeDueDateStatuses nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 38 SponsoreDueDateStatuses nvarchar -1 0 0 1 0 NULL
dbo AppSettings 39 LoginSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 40 RegisterSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 41 IranValidityConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 42 ApplicationLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 43 BusinessTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 44 EnamadLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 45 EtehadieLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 46 InstagramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 47 RubikaLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 48 SamandehiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 49 TelegramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 50 WhatsappLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 51 ShopLink nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 52 RegisterOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 53 AnjomanSenfiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 54 AparatLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 55 ShopTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 56 FinnoTechConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 57 KasboKarhayeInternetiTehranLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 58 BankGatewayRouterBaseUrl nvarchar -1 0 0 1 0 NULL
dbo AppSettings 59 ApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 60 ApiPassword nvarchar 100 0 0 1 0 NULL
dbo AppSettings 61 SadadMerchantId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 62 SadadTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 63 SadadMerchantKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 64 WalletChargeSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 65 AgentOfficePhone nvarchar 400 0 0 1 0 NULL
dbo AppSms 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 2 Date datetime2 8 27 7 0 0 NULL
dbo AppSms 3 Text nvarchar 3000 0 0 1 0 NULL
dbo AppSms 4 Price decimal 9 18 2 0 0 NULL
dbo AppSms 5 AppSmsType int 4 10 0 0 0 NULL
dbo AppSms 6 To nvarchar 100 0 0 1 0 NULL
dbo AppSms 7 Status int 4 10 0 0 0 NULL
dbo AppSms 8 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 9 EntityId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo AppSms 10 EntityType nvarchar 100 0 0 1 0 NULL
dbo AppSms 11 SmsPatternTitle nvarchar 200 0 0 1 0 NULL
dbo AppSms 12 SmsPanel int 4 10 0 0 0 ((0))
dbo AppSms 13 DeliverCheckRetryCount int 4 10 0 0 0 ((0))
dbo AppSms 14 SMSKey nvarchar -1 0 0 1 0 NULL
dbo AppSms 15 Tag nvarchar 200 0 0 1 0 NULL
dbo AspNetRoleClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetRoleClaims 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetRoleClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetRoleClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetRoles 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetRoles 2 Name nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 3 NormalizedName nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 4 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetUserClaims 2 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 1 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 2 ProviderKey nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 3 ProviderDisplayName nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 4 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetUsers 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetUsers 2 FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 3 LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 4 Gender bit 1 1 0 0 0 NULL
dbo AspNetUsers 5 Address nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 6 Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 7 LastLoginDate datetime2 8 27 7 0 0 NULL
dbo AspNetUsers 8 IsActive bit 1 1 0 0 0 NULL
dbo AspNetUsers 10 NationalCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 15 TotalSavedMoney decimal 9 18 2 0 0 NULL
dbo AspNetUsers 16 ViewCount int 4 10 0 0 0 NULL
dbo AspNetUsers 17 UserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 18 NormalizedUserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 19 Email nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 20 NormalizedEmail nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 21 EmailConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 22 PasswordHash nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 23 SecurityStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 24 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 25 PhoneNumber nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 26 PhoneNumberConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 27 TwoFactorEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 28 LockoutEnd datetimeoffset 10 34 7 1 0 NULL
dbo AspNetUsers 29 LockoutEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 30 AccessFailedCount int 4 10 0 0 0 NULL
dbo AspNetUsers 31 RegDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 32 LastLoginDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 33 RegDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 34 Familiar1FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 35 Familiar1LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 36 Familiar1Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 37 Familiar2FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 38 Familiar2LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 39 Familiar2Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 40 FatherName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 41 CustomerId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUsers 42 AffiliateCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 43 CommissionPercent int 4 10 0 0 0 ((0))
dbo AspNetUsers 44 Phone nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 45 MobileVerified bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 46 Otp int 4 10 0 0 0 ((0))
dbo AspNetUsers 47 RegistrationCompleted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 48 Credit decimal 9 18 2 0 0 ((0.0))
dbo AspNetUsers 49 BusinessName nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 50 AgentId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 53 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 54 CustomerMarketerId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 55 PostalCode nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 56 Shenasname nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 57 City nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 58 SmsActiveForMembers bit 1 1 0 0 0 (CONVERT([bit],(1)))
dbo AspNetUsers 59 AgentMetaDataId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUserTokens 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserTokens 2 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 3 Name nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 4 Value nvarchar -1 0 0 1 0 NULL
dbo Assurance 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Assurance 2 Description nvarchar 4000 0 0 1 0 NULL
dbo Assurance 3 FileName nvarchar 400 0 0 1 0 NULL
dbo Assurance 4 FileSize bigint 8 19 0 0 0 NULL
dbo Assurance 5 FileType nvarchar 40 0 0 1 0 NULL
dbo Assurance 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AuthorizationItem 2 Title nvarchar 200 0 0 1 0 NULL
dbo AuthorizationItem 3 Description nvarchar 2000 0 0 1 0 NULL
dbo AuthorizationItem 4 SystemType int 4 10 0 0 0 NULL
dbo AuthorizationItem 5 UseIfAlreadyExist bit 1 1 0 0 0 NULL
dbo AuthorizationItem 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Consultants 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Consultants 2 Name nvarchar 200 0 0 1 0 NULL
dbo Consultants 3 Phone nvarchar 40 0 0 1 0 NULL
dbo Consultants 4 Description nvarchar 2000 0 0 1 0 NULL
dbo Consultants 5 IsSeen bit 1 1 0 0 0 NULL
dbo Consultants 6 CallResult nvarchar 2000 0 0 1 0 NULL
dbo Consultants 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Contacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Contacts 2 FullName nvarchar 200 0 0 1 0 NULL
dbo Contacts 3 BusinessName nvarchar 200 0 0 1 0 NULL
dbo Contacts 4 Phone nvarchar 100 0 0 1 0 NULL
dbo Contacts 5 Address nvarchar 500 0 0 1 0 NULL
dbo Contacts 6 BankInfo nvarchar -1 0 0 1 0 NULL
dbo Contacts 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 2 Amount decimal 9 18 2 0 0 NULL
dbo CustomerMarketerCommissions 3 Date datetime2 8 27 7 0 0 NULL
dbo CustomerMarketerCommissions 4 Description nvarchar 1000 0 0 1 0 NULL
dbo CustomerMarketerCommissions 5 MarketerId bigint 8 19 0 0 0 NULL
dbo CustomerMarketerCommissions 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 2 StartDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 3 EndDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 4 MaxLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 5 RemainLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 7 PurchaseId uniqueidentifier 16 0 0 1 0 NULL
dbo Customers 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Customers 2 Name nvarchar -1 0 0 1 0 NULL
dbo Customers 3 Mobile nvarchar -1 0 0 1 0 NULL
dbo Customers 4 Email nvarchar -1 0 0 1 0 NULL
dbo Customers 5 FirstLoginDone bit 1 1 0 0 0 NULL
dbo Customers 6 InitPassword nvarchar -1 0 0 1 0 NULL
dbo Customers 7 RegDate datetime2 8 27 7 0 0 NULL
dbo Customers 8 ExpireDate datetime2 8 27 7 0 0 NULL
dbo Customers 9 Permanent bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 10 Purchased bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 11 Code int 4 10 0 0 1 NULL
dbo Customers 12 AffCode nvarchar 40 0 0 1 0 NULL
dbo Customers 13 ParkDomain nvarchar 200 0 0 1 0 NULL
dbo Expenses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Expenses 2 Amount decimal 9 18 2 0 0 NULL
dbo Expenses 3 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Expenses 4 Title nvarchar -1 0 0 1 0 NULL
dbo Expenses 5 Comment nvarchar -1 0 0 1 0 NULL
dbo Expenses 6 CostDate datetime2 8 27 7 0 0 NULL
dbo Expenses 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Expenses 8 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo IceReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IceReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IceReport 4 Price decimal 9 18 2 0 0 NULL
dbo IceReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IceReport 6 ReportID nvarchar 100 0 0 1 0 NULL
dbo IceReport 7 Status nvarchar 200 0 0 1 0 NULL
dbo IceReport 8 IceReportJson nvarchar 2000 0 0 1 0 NULL
dbo IceReport 9 Errors nvarchar 400 0 0 1 0 NULL
dbo IceReport 10 MemberId bigint 8 19 0 0 0 NULL
dbo IceReport 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 12 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IceReport 13 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IranValidityReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IranValidityReport 4 Price decimal 9 18 2 0 0 NULL
dbo IranValidityReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IranValidityReport 6 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 7 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 8 ReportID nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 9 Status int 4 10 0 0 0 NULL
dbo IranValidityReport 10 IranValidityReportJson nvarchar 2000 0 0 1 0 NULL
dbo IranValidityReport 11 Messages nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 12 MemberId bigint 8 19 0 0 0 NULL
dbo IranValidityReport 13 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 14 GradeNumber int 4 10 0 0 0 ((0))
dbo LoanAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 6 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 8 AuthorizationItemId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo LoanAuthorizationItems 9 IsPrimary bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo LoanContacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 2 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 4 Share decimal 9 18 2 0 0 NULL
dbo LoanContacts 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 2 Title nvarchar 100 0 0 0 0 NULL
dbo LoanRequestStatuses 3 StepCategory int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 4 Changable bit 1 1 0 0 0 NULL
dbo LoanRequestStatuses 5 Order int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 6 SmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo LoanRequestStatuses 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 8 SystemRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 9 StatusGroup int 4 10 0 0 0 ((0))
dbo LoanRequestStatuses 10 SystemAgentRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 11 AllowNewRequest bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Loans 2 Title nvarchar 200 0 0 1 0 NULL
dbo Loans 3 Code int 4 10 0 0 0 ((0))
dbo Loans 4 DelayPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 5 EarlyPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 6 ProfitPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 7 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Loans 8 IsSponsored bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 10 IsSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 11 FileName nvarchar 200 0 0 1 0 NULL
dbo Loans 12 IncludePlan bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 13 PlanHtml nvarchar -1 0 0 1 0 NULL
dbo Loans 14 PlanShortDescription nvarchar 2000 0 0 1 0 NULL
dbo Loans 15 PlanTitle nvarchar 200 0 0 1 0 NULL
dbo Loans 18 MaxAmount decimal 9 18 2 0 0 ((0.0))
dbo Loans 19 MaxMonthGap int 4 10 0 0 0 ((0))
dbo Loans 20 AllowedInstallments nvarchar -1 0 0 1 0 NULL
dbo Loans 21 CostsJson nvarchar -1 0 0 1 0 NULL
dbo Loans 22 Disable bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 23 DisableText nvarchar 200 0 0 1 0 NULL
dbo Loans 24 HasSponsore bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 25 DefaultSponsoreCheckoutDays int 4 10 0 0 0 ((0))
dbo MemberPurchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberPurchases 2 PaymentStep int 4 10 0 0 0 NULL
dbo MemberPurchases 3 OnlinePaymentGateway int 4 10 0 0 0 NULL
dbo MemberPurchases 4 UserId bigint 8 19 0 0 0 NULL
dbo MemberPurchases 5 UserLoanPaymentId uniqueidentifier 16 0 0 1 0 NULL
dbo MemberPurchases 6 Amount decimal 9 18 2 0 0 NULL
dbo MemberPurchases 7 StartDate datetime2 8 27 7 0 0 NULL
dbo MemberPurchases 8 Description nvarchar 400 0 0 1 0 NULL
dbo MemberPurchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo MemberPurchases 14 SepJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 15 ZarinPalJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 16 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo MemberPurchases 17 MemberPurchaseType int 4 10 0 0 0 ((0))
dbo MemberPurchases 18 NextPayJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 19 Code int 4 10 0 0 1 NULL
dbo MemberPurchases 20 IPGParsianJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 21 CreatorUserId bigint 8 19 0 1 0 NULL
dbo MemberPurchases 22 SadadJson nvarchar -1 0 0 1 0 NULL
dbo OffDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OffDate 2 Date datetime2 8 27 7 0 0 NULL
dbo OffDate 3 Title nvarchar 200 0 0 1 0 NULL
dbo OffDate 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 2 Amount decimal 9 18 2 0 0 NULL
dbo OnlineMoneyTransfer 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 4 OnlineMoneyTransferStep int 4 10 0 0 0 NULL
dbo OnlineMoneyTransfer 5 From nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 6 To nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 7 OTP nvarchar 20 0 0 1 0 NULL
dbo OnlineMoneyTransfer 8 OTPGenerateDateTime datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 9 OurTraceNumber nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 10 Cif nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 11 IsSuccess bit 1 1 0 0 0 NULL
dbo OnlineMoneyTransfer 12 EFardaJson nvarchar -1 0 0 1 0 NULL
dbo OnlineMoneyTransfer 13 TransactionId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 14 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 15 OnlineMoneyTransferPanelId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 16 ToName nvarchar -1 0 0 1 0 NULL
dbo Purchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 2 ProductType int 4 10 0 0 0 NULL
dbo Purchases 3 PaymentStep int 4 10 0 0 0 NULL
dbo Purchases 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Purchases 5 UserId bigint 8 19 0 0 0 NULL
dbo Purchases 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 7 Amount decimal 9 18 2 0 0 NULL
dbo Purchases 8 StartDate datetime2 8 27 7 0 0 NULL
dbo Purchases 9 Description nvarchar 400 0 0 1 0 NULL
dbo Purchases 10 ZarinPalAuthority nvarchar 100 0 0 1 0 NULL
dbo Purchases 11 ZarinPalRefId nvarchar -1 0 0 1 0 NULL
dbo Purchases 12 ZarinPalStatus int 4 10 0 0 0 NULL
dbo Purchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo Purchases 14 AffCode nvarchar 40 0 0 1 0 NULL
dbo Purchases 15 LoanCount int 4 10 0 0 0 ((0))
dbo SmsPatterns 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 2 Title nvarchar 400 0 0 1 0 NULL
dbo SmsPatterns 3 Pattern nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 4 IsSystem bit 1 1 0 0 0 NULL
dbo SmsPatterns 5 Status int 4 10 0 0 0 NULL
dbo SmsPatterns 6 RejectReason nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 8 IsPatternBase bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo SmsPatterns 9 PatternBaseCode nvarchar 40 0 0 1 0 NULL
dbo SmsPatterns 10 SmsPatternPanel int 4 10 0 0 0 ((0))
dbo SmsPatterns 11 Category int 4 10 0 0 0 ((0))
dbo SubAgentTransactions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SubAgentTransactions 2 Amount decimal 9 18 2 0 0 NULL
dbo SubAgentTransactions 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo SubAgentTransactions 4 PaymentMethod int 4 10 0 0 0 NULL
dbo SubAgentTransactions 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo SubAgentTransactions 6 Description nvarchar 1000 0 0 1 0 NULL
dbo SubAgentTransactions 7 SavedBy nvarchar 200 0 0 1 0 NULL
dbo SubAgentTransactions 8 FileName nvarchar 100 0 0 1 0 NULL
dbo SubAgentTransactions 9 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo SubAgentTransactions 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 2 DefaultThirdParty int 4 10 0 0 0 NULL
dbo ThirdPartySettings 3 LandaSettingsJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartySettings 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 5 DigibileSettingsJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartyTransfer 2 EntityId nvarchar 100 0 0 1 0 NULL
dbo ThirdPartyTransfer 3 EntityType nvarchar 100 0 0 1 0 NULL
dbo ThirdPartyTransfer 4 LandaJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 5 EntityTag nvarchar 500 0 0 1 0 NULL
dbo ThirdPartyTransfer 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartyTransfer 7 NikanJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 8 DigibileJson nvarchar -1 0 0 1 0 NULL
dbo UserLoanContact 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 3 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 4 Share decimal 9 18 2 0 0 NULL
dbo UserLoanContact 5 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanContact 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 7 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanPaymentRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 2 UserLoanPaymentId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 3 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 4 PaymentDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPaymentRequests 6 MemberDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 7 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 8 Status int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 9 PaymentMethod int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 10 TrackNumber nvarchar 100 0 0 1 0 NULL
dbo UserLoanPaymentRequests 11 AdminAcceptorId bigint 8 19 0 1 0 NULL
dbo UserLoanPaymentRequests 12 AdminAcceptDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 13 AffectOnMainPayment bit 1 1 0 0 0 NULL
dbo UserLoanPaymentRequests 14 FileName nvarchar 100 0 0 1 0 NULL
dbo UserLoanPayments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 3 InstallmentNumber int 4 10 0 0 0 NULL
dbo UserLoanPayments 4 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPayments 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPayments 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanPayments 9 DelayDay int 4 10 0 0 0 ((0))
dbo UserLoanPayments 10 DelayPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 11 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 12 GoldRate float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 13 GoldWeight float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 14 PaymentMethod int 4 10 0 0 0 ((0))
dbo UserLoanPayments 15 IsGoldCheckouted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 16 Code int 4 10 0 0 1 NULL
dbo UserLoanPayments 17 SentDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 18 InstallmentAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 19 SentOverDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequestAuthorizationItemAttachments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 2 UserLoanRequestAuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 3 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 4 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 5 AttachmentByAdmin bit 1 1 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 2 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 3 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 4 CreateDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 5 LastChangeDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 6 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 7 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 8 AdminDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 9 Status int 4 10 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 10 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 11 AttachmentByAdmin bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequests 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 4 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanRequests 6 Comment nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 7 AdminDescriptionPrivate nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 9 Month int 4 10 0 0 0 NULL
dbo UserLoanRequests 10 Year int 4 10 0 0 0 NULL
dbo UserLoanRequests 11 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo UserLoanRequests 12 InstallmentCount int 4 10 0 0 0 ((0))
dbo UserLoanRequests 13 MonthGap int 4 10 0 0 0 ((0))
dbo UserLoanRequests 14 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoanRequests 15 Code int 4 10 0 0 1 NULL
dbo UserLoanRequests 16 Installment decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 18 IsPhysicalDocsDelivered bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequests 19 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequests 20 SponsoreDueDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanRequests 21 StatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 22 AgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 23 ChargeType int 4 10 0 0 0 ((0))
dbo UserLoanRequests 24 SponsoreAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 25 LockedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequestStatusHistories 3 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 4 DateTime datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestStatusHistories 5 FromStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 6 FromAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 7 ToStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 8 ToAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 4 StartDate datetime2 8 27 7 0 0 NULL
dbo UserLoans 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoans 6 Installment decimal 9 18 2 0 0 NULL
dbo UserLoans 7 Month int 4 10 0 0 0 NULL
dbo UserLoans 8 Paid decimal 9 18 2 0 0 NULL
dbo UserLoans 9 Remain decimal 9 18 2 0 0 NULL
dbo UserLoans 10 CheckoutDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 11 IsCheckouted bit 1 1 0 1 0 NULL
dbo UserLoans 12 Code int 4 10 0 0 1 NULL
dbo UserLoans 13 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoans 14 MonthGap int 4 10 0 0 0 ((1))
dbo UserLoans 15 PayableAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 16 CustomerPurchasePlanId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 17 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 18 UserLoanRequestId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 19 AgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 20 AgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 21 SubAgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 22 SubAgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 23 SubAgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 24 DepositChargeDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 25 PreDepositAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 26 Status nvarchar 100 0 0 1 0 NULL
dbo UserLoanSponsoreDueDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 3 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanSponsoreDueDate 4 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanSponsoreDueDate 5 Description nvarchar 1000 0 0 1 0 NULL
dbo UserLoanSponsoreDueDate 6 IsCheckouted bit 1 1 0 0 0 NULL
dbo UserLoanSponsoreDueDate 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 8 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserSavedMonies 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserSavedMonies 2 MemberId bigint 8 19 0 0 0 NULL
dbo UserSavedMonies 3 Description nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 4 Amount decimal 9 18 2 0 0 NULL
dbo UserSavedMonies 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserSavedMonies 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo VisitorLogs 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo VisitorLogs 2 Date datetime2 8 27 7 0 0 NULL
dbo VisitorLogs 3 IpAddress nvarchar 100 0 0 1 0 NULL
dbo VisitorLogs 4 UserAgent nvarchar 400 0 0 1 0 NULL
dbo VisitorLogs 5 Mrk nvarchar -1 0 0 1 0 NULL
dbo Withdraws 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Withdraws 2 Amount decimal 9 18 2 0 0 NULL
dbo Withdraws 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo Withdraws 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Withdraws 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo Withdraws 6 IsUnknown bit 1 1 0 0 0 NULL
dbo Withdraws 7 GoldWeight float 8 53 0 0 0 NULL
dbo Withdraws 8 GoldRate float 8 53 0 0 0 NULL
dbo Withdraws 9 Description nvarchar -1 0 0 1 0 NULL
dbo Withdraws 10 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Withdraws 11 WeightBalance float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Withdraws 12 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Withdraws 13 SponsoredLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 14 AgentId bigint 8 19 0 1 0 NULL
dbo Withdraws 15 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 16 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 17 UserLoanContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 18 FileName nvarchar 100 0 0 1 0 NULL
dbo Withdraws 19 SuccessfullOnlineMoneyTransferId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 20 CustomerMarketerCommissionId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 21 FileName2 nvarchar 100 0 0 1 0 NULL
dbo Withdraws 22 FileName3 nvarchar 100 0 0 1 0 NULL
HangFire AggregatedCounter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire AggregatedCounter 3 Value bigint 8 19 0 0 0 NULL
HangFire AggregatedCounter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Counter 3 Value int 4 10 0 0 0 NULL
HangFire Counter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 5 Id bigint 8 19 0 0 1 NULL
HangFire Hash 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Hash 3 Field nvarchar 200 0 0 0 0 NULL
HangFire Hash 4 Value nvarchar -1 0 0 1 0 NULL
HangFire Hash 5 ExpireAt datetime2 8 27 7 1 0 NULL
HangFire Job 1 Id bigint 8 19 0 0 1 NULL
HangFire Job 2 StateId bigint 8 19 0 1 0 NULL
HangFire Job 3 StateName nvarchar 40 0 0 1 0 NULL
HangFire Job 4 InvocationData nvarchar -1 0 0 0 0 NULL
HangFire Job 5 Arguments nvarchar -1 0 0 0 0 NULL
HangFire Job 6 CreatedAt datetime 8 23 3 0 0 NULL
HangFire Job 7 ExpireAt datetime 8 23 3 1 0 NULL
HangFire JobParameter 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobParameter 3 Name nvarchar 80 0 0 0 0 NULL
HangFire JobParameter 4 Value nvarchar -1 0 0 1 0 NULL
HangFire JobQueue 1 Id bigint 8 19 0 0 1 NULL
HangFire JobQueue 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobQueue 3 Queue nvarchar 100 0 0 0 0 NULL
HangFire JobQueue 4 FetchedAt datetime 8 23 3 1 0 NULL
HangFire List 1 Id bigint 8 19 0 0 1 NULL
HangFire List 2 Key nvarchar 200 0 0 0 0 NULL
HangFire List 3 Value nvarchar -1 0 0 1 0 NULL
HangFire List 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Schema 1 Version int 4 10 0 0 0 NULL
HangFire Server 1 Id nvarchar 400 0 0 0 0 NULL
HangFire Server 2 Data nvarchar -1 0 0 1 0 NULL
HangFire Server 3 LastHeartbeat datetime 8 23 3 0 0 NULL
HangFire Set 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Set 3 Score float 8 53 0 0 0 NULL
HangFire Set 4 Value nvarchar 512 0 0 0 0 NULL
HangFire Set 5 ExpireAt datetime 8 23 3 1 0 NULL
HangFire State 1 Id bigint 8 19 0 0 1 NULL
HangFire State 2 JobId bigint 8 19 0 0 0 NULL
HangFire State 3 Name nvarchar 40 0 0 0 0 NULL
HangFire State 4 Reason nvarchar 200 0 0 1 0 NULL
HangFire State 5 CreatedAt datetime 8 23 3 0 0 NULL
HangFire State 6 Data nvarchar -1 0 0 1 0 NULL
```

### PRIMARY AND UNIQUE KEYS

```text
schema_name table_name index_name is_primary_key is_unique key_ordinal column_name
----------- ---------- ---------- -------------- --------- ----------- -----------
dbo __EFMigrationsHistory PK___EFMigrationsHistory 1 1 1 MigrationId
dbo AffiliateCommissions PK_AffiliateCommissions 1 1 1 Id
dbo AgentLoanAuthorizationItem PK_AgentLoanAuthorizationItem 1 1 1 Id
dbo AgentLoans PK_AgentLoans 1 1 1 Id
dbo AgentMetaData IX_AgentMetaData_UserId 0 1 1 UserId
dbo AgentMetaData PK_AgentMetaData 1 1 1 Id
dbo AppSettings PK_AppSettings 1 1 1 Id
dbo AppSms PK_AppSms 1 1 1 Id
dbo AspNetRoleClaims PK_AspNetRoleClaims 1 1 1 Id
dbo AspNetRoles PK_AspNetRoles 1 1 1 Id
dbo AspNetRoles RoleNameIndex 0 1 1 NormalizedName
dbo AspNetUserClaims PK_AspNetUserClaims 1 1 1 Id
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 1 LoginProvider
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 2 ProviderKey
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 1 UserId
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 2 RoleId
dbo AspNetUsers PK_AspNetUsers 1 1 1 Id
dbo AspNetUsers UserNameIndex 0 1 1 NormalizedUserName
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 1 UserId
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 2 LoginProvider
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 3 Name
dbo Assurance PK_Assurance 1 1 1 Id
dbo AuthorizationItem PK_AuthorizationItem 1 1 1 Id
dbo Consultants PK_Consultants 1 1 1 Id
dbo Contacts PK_Contacts 1 1 1 Id
dbo CustomerMarketerCommissions PK_CustomerMarketerCommissions 1 1 1 Id
dbo CustomerPurchasePlan PK_CustomerPurchasePlan 1 1 1 Id
dbo Customers PK_Customers 1 1 1 Id
dbo Expenses PK_Expenses 1 1 1 Id
dbo IceReport PK_IceReport 1 1 1 Id
dbo IranValidityReport PK_IranValidityReport 1 1 1 Id
dbo LoanAuthorizationItems PK_LoanAuthorizationItems 1 1 1 Id
dbo LoanContacts PK_LoanContacts 1 1 1 Id
dbo LoanRequestStatuses PK_LoanRequestStatuses 1 1 1 Id
dbo Loans PK_Loans 1 1 1 Id
dbo MemberPurchases PK_MemberPurchases 1 1 1 Id
dbo OffDate PK_OffDate 1 1 1 Id
dbo OnlineMoneyTransfer PK_OnlineMoneyTransfer 1 1 1 Id
dbo Purchases PK_Purchases 1 1 1 Id
dbo SmsPatterns PK_SmsPatterns 1 1 1 Id
dbo SubAgentTransactions PK_SubAgentTransactions 1 1 1 Id
dbo ThirdPartySettings PK_ThirdPartySettings 1 1 1 Id
dbo ThirdPartyTransfer PK_ThirdPartyTransfer 1 1 1 Id
dbo UserLoanContact PK_UserLoanContact 1 1 1 Id
dbo UserLoanPaymentRequests PK_UserLoanPaymentRequests 1 1 1 Id
dbo UserLoanPayments PK_UserLoanPayments 1 1 1 Id
dbo UserLoanRequestAuthorizationItemAttachments PK_UserLoanRequestAuthorizationItemAttachments 1 1 1 Id
dbo UserLoanRequestAuthorizationItems PK_UserLoanRequestAuthorizationItems 1 1 1 Id
dbo UserLoanRequests PK_UserLoanRequests 1 1 1 Id
dbo UserLoanRequestStatusHistories PK_UserLoanRequestStatusHistories 1 1 1 Id
dbo UserLoans PK_UserLoans 1 1 1 Id
dbo UserLoanSponsoreDueDate PK_UserLoanSponsoreDueDate 1 1 1 Id
dbo UserSavedMonies PK_UserSavedMonies 1 1 1 Id
dbo VisitorLogs PK_VisitorLogs 1 1 1 Id
dbo Withdraws PK_Withdraws 1 1 1 Id
HangFire AggregatedCounter PK_HangFire_CounterAggregated 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 2 Id
HangFire Hash PK_HangFire_Hash 1 1 1 Key
HangFire Hash PK_HangFire_Hash 1 1 2 Field
HangFire Job PK_HangFire_Job 1 1 1 Id
HangFire JobParameter PK_HangFire_JobParameter 1 1 1 JobId
HangFire JobParameter PK_HangFire_JobParameter 1 1 2 Name
HangFire JobQueue PK_HangFire_JobQueue 1 1 1 Queue
HangFire JobQueue PK_HangFire_JobQueue 1 1 2 Id
HangFire List PK_HangFire_List 1 1 1 Key
HangFire List PK_HangFire_List 1 1 2 Id
HangFire Schema PK_HangFire_Schema 1 1 1 Version
HangFire Server PK_HangFire_Server 1 1 1 Id
HangFire Set PK_HangFire_Set 1 1 1 Key
HangFire Set PK_HangFire_Set 1 1 2 Value
HangFire State PK_HangFire_State 1 1 1 JobId
HangFire State PK_HangFire_State 1 1 2 Id
```

### FOREIGN KEYS

```text
source_table source_column target_table target_column constraint_name delete_referential_action_desc update_referential_action_desc is_disabled
------------ ------------- ------------ ------------- --------------- ------------------------------ ------------------------------ -----------
dbo.AffiliateCommissions UserId dbo.AspNetUsers Id FK_AffiliateCommissions_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AffiliateCommissions PurchaseId dbo.Purchases Id FK_AffiliateCommissions_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem AuthorizationItemId dbo.AuthorizationItem Id FK_AgentLoanAuthorizationItem_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem CustomerId dbo.Customers Id FK_AgentLoanAuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem LoanId dbo.Loans Id FK_AgentLoanAuthorizationItem_Loans_LoanId CASCADE NO_ACTION 0
dbo.AgentLoans AgentId dbo.AspNetUsers Id FK_AgentLoans_AspNetUsers_AgentId CASCADE NO_ACTION 0
dbo.AgentLoans ContactId dbo.Contacts Id FK_AgentLoans_Contacts_ContactId CASCADE NO_ACTION 0
dbo.AgentLoans CustomerId dbo.Customers Id FK_AgentLoans_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AgentLoans LoanId dbo.Loans Id FK_AgentLoans_Loans_LoanId CASCADE NO_ACTION 0
dbo.AgentMetaData UserId dbo.AspNetUsers Id FK_AgentMetaData_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AgentMetaData CustomerId dbo.Customers Id FK_AgentMetaData_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AppSettings CustomerId dbo.Customers Id FK_AppSettings_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AppSettings BeforeDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_BeforeDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DueDateRememberSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DueDateRememberSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings LoginSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_LoginSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings OverDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_OverDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThanksPaymentSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThanksPaymentSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletChargeSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletChargeSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSms CustomerId dbo.Customers Id FK_AppSms_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetRoleClaims RoleId dbo.AspNetRoles Id FK_AspNetRoleClaims_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserClaims UserId dbo.AspNetUsers Id FK_AspNetUserClaims_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserLogins UserId dbo.AspNetUsers Id FK_AspNetUserLogins_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserRoles RoleId dbo.AspNetRoles Id FK_AspNetUserRoles_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserRoles UserId dbo.AspNetUsers Id FK_AspNetUserRoles_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUsers AgentId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerMarketerId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_CustomerMarketerId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerId dbo.Customers Id FK_AspNetUsers_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetUserTokens UserId dbo.AspNetUsers Id FK_AspNetUserTokens_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.Assurance UserLoanId dbo.UserLoans Id FK_Assurance_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.AuthorizationItem CustomerId dbo.Customers Id FK_AuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Contacts CustomerId dbo.Customers Id FK_Contacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.CustomerMarketerCommissions MarketerId dbo.AspNetUsers Id FK_CustomerMarketerCommissions_AspNetUsers_MarketerId CASCADE NO_ACTION 0
dbo.CustomerMarketerCommissions UserLoanId dbo.UserLoans Id FK_CustomerMarketerCommissions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.CustomerPurchasePlan CustomerId dbo.Customers Id FK_CustomerPurchasePlan_Customers_CustomerId CASCADE NO_ACTION 0
dbo.CustomerPurchasePlan PurchaseId dbo.Purchases Id FK_CustomerPurchasePlan_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.Expenses CustomerId dbo.Customers Id FK_Expenses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.IceReport MemberId dbo.AspNetUsers Id FK_IceReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IceReport CustomerId dbo.Customers Id FK_IceReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.IranValidityReport MemberId dbo.AspNetUsers Id FK_IranValidityReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IranValidityReport CustomerId dbo.Customers Id FK_IranValidityReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_LoanAuthorizationItems_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems CustomerId dbo.Customers Id FK_LoanAuthorizationItems_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems LoanId dbo.Loans Id FK_LoanAuthorizationItems_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanContacts ContactId dbo.Contacts Id FK_LoanContacts_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.LoanContacts CustomerId dbo.Customers Id FK_LoanContacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanContacts LoanId dbo.Loans Id FK_LoanContacts_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses CustomerId dbo.Customers Id FK_LoanRequestStatuses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses SmsPatternId dbo.SmsPatterns Id FK_LoanRequestStatuses_SmsPatterns_SmsPatternId NO_ACTION NO_ACTION 0
dbo.Loans CustomerId dbo.Customers Id FK_Loans_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.MemberPurchases CreatorUserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_CreatorUserId NO_ACTION NO_ACTION 0
dbo.MemberPurchases UserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.MemberPurchases UserLoanPaymentId dbo.UserLoanPayments Id FK_MemberPurchases_UserLoanPayments_UserLoanPaymentId NO_ACTION NO_ACTION 0
dbo.OffDate CustomerId dbo.Customers Id FK_OffDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer CustomerId dbo.Customers Id FK_OnlineMoneyTransfer_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer TransactionId dbo.Withdraws Id FK_OnlineMoneyTransfer_Withdraws_TransactionId NO_ACTION NO_ACTION 0
dbo.Purchases UserId dbo.AspNetUsers Id FK_Purchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.Purchases CustomerId dbo.Customers Id FK_Purchases_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SmsPatterns CustomerId dbo.Customers Id FK_SmsPatterns_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions CustomerId dbo.Customers Id FK_SubAgentTransactions_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions UserLoanId dbo.UserLoans Id FK_SubAgentTransactions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.ThirdPartySettings CustomerId dbo.Customers Id FK_ThirdPartySettings_Customers_CustomerId CASCADE NO_ACTION 0
dbo.ThirdPartyTransfer CustomerId dbo.Customers Id FK_ThirdPartyTransfer_Customers_CustomerId CASCADE NO_ACTION 0
dbo.UserLoanContact ContactId dbo.Contacts Id FK_UserLoanContact_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.UserLoanContact CustomerId dbo.Customers Id FK_UserLoanContact_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanContact UserLoanId dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanContact UserLoanId1 dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentRequests AdminAcceptorId dbo.AspNetUsers Id FK_UserLoanPaymentRequests_AspNetUsers_AdminAcceptorId NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentRequests UserLoanPaymentId dbo.UserLoanPayments Id FK_UserLoanPaymentRequests_UserLoanPayments_UserLoanPaymentId CASCADE NO_ACTION 0
dbo.UserLoanPayments UserLoanId dbo.UserLoans Id FK_UserLoanPayments_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestAuthorizationItemAttachments UserLoanRequestAuthorizationItemId dbo.UserLoanRequestAuthorizationItems Id FK_UserLoanRequestAuthorizationItemAttachments_UserLoanRequestAuthorizationItems_UserLoanRequestAuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_UserLoanRequestAuthorizationItems_AuthorizationItem_AuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestAuthorizationItems_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests AgentId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests UserId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequests AgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_AgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests StatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_StatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests LoanId dbo.Loans Id FK_UserLoanRequests_Loans_LoanId CASCADE NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserId dbo.AspNetUsers Id FK_UserLoanRequestStatusHistories_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestStatusHistories_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoans AgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoans SubAgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_SubAgentId NO_ACTION NO_ACTION 0
dbo.UserLoans UserId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoans CustomerPurchasePlanId dbo.CustomerPurchasePlan Id FK_UserLoans_CustomerPurchasePlan_CustomerPurchasePlanId NO_ACTION NO_ACTION 0
dbo.UserLoans LoanId dbo.Loans Id FK_UserLoans_Loans_LoanId NO_ACTION NO_ACTION 0
dbo.UserLoans UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoans_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate CustomerId dbo.Customers Id FK_UserLoanSponsoreDueDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId1 dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserSavedMonies MemberId dbo.AspNetUsers Id FK_UserSavedMonies_AspNetUsers_MemberId CASCADE NO_ACTION 0
dbo.Withdraws AgentId dbo.AspNetUsers Id FK_Withdraws_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.Withdraws ContactId dbo.Contacts Id FK_Withdraws_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerMarketerCommissionId dbo.CustomerMarketerCommissions Id FK_Withdraws_CustomerMarketerCommissions_CustomerMarketerCommissionId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerId dbo.Customers Id FK_Withdraws_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Withdraws SponsoredLoanId dbo.Loans Id FK_Withdraws_Loans_SponsoredLoanId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanContactId dbo.UserLoanContact Id FK_Withdraws_UserLoanContact_UserLoanContactId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanId dbo.UserLoans Id FK_Withdraws_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
HangFire.JobParameter JobId HangFire.Job Id FK_HangFire_JobParameter_Job CASCADE CASCADE 0
HangFire.State JobId HangFire.Job Id FK_HangFire_State_Job CASCADE CASCADE 0
```

### CHECK CONSTRAINTS

```text
schema_name table_name constraint_name definition is_disabled
----------- ---------- --------------- ---------- -----------
```

### TOTALS

```text
table_count column_count foreign_key_count check_constraint_count primary_key_count
----------- ------------ ----------------- ---------------------- -----------------
59 614 104 0 59
```

## vamcityc_bluvamdb_import_20261028

### TABLE ROW COUNTS

```text
schema_name table_name row_count
----------- ---------- ---------
dbo __EFMigrationsHistory 140
dbo AffiliateCommissions 0
dbo AgentLoanAuthorizationItem 24
dbo AgentLoans 688
dbo AppSettings 1
dbo AppSms 87389
dbo AspNetRoleClaims 0
dbo AspNetRoles 6
dbo AspNetUserClaims 23
dbo AspNetUserLogins 0
dbo AspNetUserRoles 49864
dbo AspNetUsers 49867
dbo AspNetUserTokens 0
dbo Assurance 1
dbo AuthorizationItem 40
dbo Consultants 1
dbo Contacts 3
dbo CustomerMarketerCommissions 21
dbo CustomerPurchasePlan 2
dbo Customers 2
dbo Expenses 0
dbo IceReport 56
dbo IranValidityReport 865
dbo LoanAuthorizationItems 83
dbo LoanContacts 1
dbo LoanRequestStatuses 89
dbo Loans 45
dbo MemberPurchases 2418
dbo OffDate 140
dbo OnlineMoneyTransfer 121
dbo Purchases 0
dbo SmsPatterns 43
dbo SubAgentTransactions 0
dbo UserLoanContact 4
dbo UserLoanPaymentRequests 86
dbo UserLoanPayments 14180
dbo UserLoanRequestAuthorizationItemAttachments 10117
dbo UserLoanRequestAuthorizationItems 9992
dbo UserLoanRequests 12232
dbo UserLoanRequestStatusHistories 35663
dbo UserLoans 713
dbo UserLoanSponsoreDueDate 4
dbo UserSavedMonies 0
dbo VisitorLogs 11157
dbo Withdraws 514
HangFire AggregatedCounter 1
HangFire Counter 0
HangFire Hash 0
HangFire Job 0
HangFire JobParameter 0
HangFire JobQueue 0
HangFire List 0
HangFire Schema 1
HangFire Server 0
HangFire Set 0
HangFire State 0
```

### ALL COLUMNS

```text
schema_name table_name column_id column_name data_type max_length precision scale is_nullable is_identity default_definition
----------- ---------- --------- ----------- --------- ---------- --------- ----- ----------- ----------- ------------------
dbo __EFMigrationsHistory 1 MigrationId nvarchar 300 0 0 0 0 NULL
dbo __EFMigrationsHistory 2 ProductVersion nvarchar 64 0 0 0 0 NULL
dbo AffiliateCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AffiliateCommissions 2 Amount int 4 10 0 0 0 NULL
dbo AffiliateCommissions 3 PaidToUser int 4 10 0 0 0 NULL
dbo AffiliateCommissions 4 Date datetime2 8 27 7 0 0 NULL
dbo AffiliateCommissions 5 Description nvarchar 1000 0 0 1 0 NULL
dbo AffiliateCommissions 6 UserId bigint 8 19 0 0 0 NULL
dbo AffiliateCommissions 7 PurchaseId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 2 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 2 AgentId bigint 8 19 0 0 0 NULL
dbo AgentLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 4 Percent decimal 9 18 2 0 0 NULL
dbo AgentLoans 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 6 DefaultCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 7 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo AgentLoans 8 ContactPercent decimal 9 18 2 0 0 NULL
dbo AgentLoans 11 ProductCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 12 ProductPercent decimal 9 18 2 0 0 ((0.0))
dbo AppSettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSettings 5 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo AppSettings 6 IsOnlinePaymentActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 7 OnlinePaymentGateway int 4 10 0 0 0 ((0))
dbo AppSettings 8 Shaba nvarchar 100 0 0 1 0 NULL
dbo AppSettings 9 ZarinpalMerchantCode nvarchar 400 0 0 1 0 NULL
dbo AppSettings 10 DueDateRememberSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 11 DueDatedRememberSmsTime time 5 16 7 1 0 NULL
dbo AppSettings 12 SmsCredit int 4 10 0 0 0 ((0))
dbo AppSettings 13 ThanksPaymentSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 14 AppendToWhichInstallment int 4 10 0 0 0 ((0))
dbo AppSettings 15 RoundCountNumber tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AppSettings 16 OverDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 17 OverDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 18 SepTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 19 DashboardSettingsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 20 BeforeDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 21 IsDueDateSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 22 IsRememberSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 23 OverDueDayRemeberOnce bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 24 BeforeDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 25 DefaultSmsPanel int 4 10 0 0 0 ((0))
dbo AppSettings 26 MelliPayamakConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 27 KaveNegarConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 28 BankInfo nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 29 IceConfigJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 30 NextPayApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 31 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 32 IPGParsianLoginAccount nvarchar 400 0 0 1 0 NULL
dbo AppSettings 33 Address nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 34 Email nvarchar -1 0 0 1 0 NULL
dbo AppSettings 35 Phones nvarchar 400 0 0 1 0 NULL
dbo AppSettings 36 ThemeSettingsJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 37 DepositChargeDueDateStatuses nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 38 SponsoreDueDateStatuses nvarchar -1 0 0 1 0 NULL
dbo AppSettings 39 LoginSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 40 RegisterSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 41 IranValidityConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 42 ApplicationLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 43 BusinessTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 44 EnamadLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 45 EtehadieLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 46 InstagramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 47 RubikaLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 48 SamandehiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 49 TelegramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 50 WhatsappLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 51 ShopLink nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 52 RegisterOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 53 AnjomanSenfiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 54 AparatLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 55 ShopTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 56 FinnoTechConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 57 KasboKarhayeInternetiTehranLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 58 BankGatewayRouterBaseUrl nvarchar -1 0 0 1 0 NULL
dbo AppSettings 59 ApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 60 ApiPassword nvarchar 100 0 0 1 0 NULL
dbo AppSettings 61 SadadMerchantId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 62 SadadTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 63 SadadMerchantKey nvarchar -1 0 0 1 0 NULL
dbo AppSms 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 2 Date datetime2 8 27 7 0 0 NULL
dbo AppSms 3 Text nvarchar 3000 0 0 1 0 NULL
dbo AppSms 4 Price decimal 9 18 2 0 0 NULL
dbo AppSms 5 AppSmsType int 4 10 0 0 0 NULL
dbo AppSms 6 To nvarchar 100 0 0 1 0 NULL
dbo AppSms 7 Status int 4 10 0 0 0 NULL
dbo AppSms 8 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 9 EntityId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo AppSms 10 EntityType nvarchar 100 0 0 1 0 NULL
dbo AppSms 11 SmsPatternTitle nvarchar 200 0 0 1 0 NULL
dbo AppSms 12 SmsPanel int 4 10 0 0 0 ((0))
dbo AppSms 13 DeliverCheckRetryCount int 4 10 0 0 0 ((0))
dbo AppSms 14 SMSKey nvarchar -1 0 0 1 0 NULL
dbo AppSms 15 Tag nvarchar 200 0 0 1 0 NULL
dbo AspNetRoleClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetRoleClaims 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetRoleClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetRoleClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetRoles 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetRoles 2 Name nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 3 NormalizedName nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 4 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetUserClaims 2 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 1 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 2 ProviderKey nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 3 ProviderDisplayName nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 4 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetUsers 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetUsers 2 FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 3 LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 4 Gender bit 1 1 0 0 0 NULL
dbo AspNetUsers 5 Address nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 6 Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 7 LastLoginDate datetime2 8 27 7 0 0 NULL
dbo AspNetUsers 8 IsActive bit 1 1 0 0 0 NULL
dbo AspNetUsers 10 NationalCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 15 TotalSavedMoney decimal 9 18 2 0 0 NULL
dbo AspNetUsers 16 ViewCount int 4 10 0 0 0 NULL
dbo AspNetUsers 17 UserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 18 NormalizedUserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 19 Email nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 20 NormalizedEmail nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 21 EmailConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 22 PasswordHash nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 23 SecurityStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 24 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 25 PhoneNumber nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 26 PhoneNumberConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 27 TwoFactorEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 28 LockoutEnd datetimeoffset 10 34 7 1 0 NULL
dbo AspNetUsers 29 LockoutEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 30 AccessFailedCount int 4 10 0 0 0 NULL
dbo AspNetUsers 31 RegDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 32 LastLoginDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 33 RegDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 34 Familiar1FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 35 Familiar1LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 36 Familiar1Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 37 Familiar2FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 38 Familiar2LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 39 Familiar2Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 40 FatherName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 41 CustomerId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUsers 42 AffiliateCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 43 CommissionPercent int 4 10 0 0 0 ((0))
dbo AspNetUsers 44 Phone nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 45 MobileVerified bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 46 Otp int 4 10 0 0 0 ((0))
dbo AspNetUsers 47 RegistrationCompleted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 48 Credit decimal 9 18 2 0 0 ((0.0))
dbo AspNetUsers 49 BusinessName nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 50 AgentId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 53 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 54 CustomerMarketerId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 55 PostalCode nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 56 Shenasname nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 57 City nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 58 SmsActiveForMembers bit 1 1 0 0 0 (CONVERT([bit],(1)))
dbo AspNetUserTokens 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserTokens 2 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 3 Name nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 4 Value nvarchar -1 0 0 1 0 NULL
dbo Assurance 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Assurance 2 Description nvarchar 4000 0 0 1 0 NULL
dbo Assurance 3 FileName nvarchar 400 0 0 1 0 NULL
dbo Assurance 4 FileSize bigint 8 19 0 0 0 NULL
dbo Assurance 5 FileType nvarchar 40 0 0 1 0 NULL
dbo Assurance 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AuthorizationItem 2 Title nvarchar 200 0 0 1 0 NULL
dbo AuthorizationItem 3 Description nvarchar 2000 0 0 1 0 NULL
dbo AuthorizationItem 4 SystemType int 4 10 0 0 0 NULL
dbo AuthorizationItem 5 UseIfAlreadyExist bit 1 1 0 0 0 NULL
dbo AuthorizationItem 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Consultants 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Consultants 2 Name nvarchar 200 0 0 1 0 NULL
dbo Consultants 3 Phone nvarchar 40 0 0 1 0 NULL
dbo Consultants 4 Description nvarchar 2000 0 0 1 0 NULL
dbo Consultants 5 IsSeen bit 1 1 0 0 0 NULL
dbo Consultants 6 CallResult nvarchar 2000 0 0 1 0 NULL
dbo Consultants 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Contacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Contacts 2 FullName nvarchar 200 0 0 1 0 NULL
dbo Contacts 3 BusinessName nvarchar 200 0 0 1 0 NULL
dbo Contacts 4 Phone nvarchar 100 0 0 1 0 NULL
dbo Contacts 5 Address nvarchar 500 0 0 1 0 NULL
dbo Contacts 6 BankInfo nvarchar -1 0 0 1 0 NULL
dbo Contacts 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 2 Amount decimal 9 18 2 0 0 NULL
dbo CustomerMarketerCommissions 3 Date datetime2 8 27 7 0 0 NULL
dbo CustomerMarketerCommissions 4 Description nvarchar 1000 0 0 1 0 NULL
dbo CustomerMarketerCommissions 5 MarketerId bigint 8 19 0 0 0 NULL
dbo CustomerMarketerCommissions 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 2 StartDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 3 EndDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 4 MaxLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 5 RemainLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 7 PurchaseId uniqueidentifier 16 0 0 1 0 NULL
dbo Customers 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Customers 2 Name nvarchar -1 0 0 1 0 NULL
dbo Customers 3 Mobile nvarchar -1 0 0 1 0 NULL
dbo Customers 4 Email nvarchar -1 0 0 1 0 NULL
dbo Customers 5 FirstLoginDone bit 1 1 0 0 0 NULL
dbo Customers 6 InitPassword nvarchar -1 0 0 1 0 NULL
dbo Customers 7 RegDate datetime2 8 27 7 0 0 NULL
dbo Customers 8 ExpireDate datetime2 8 27 7 0 0 NULL
dbo Customers 9 Permanent bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 10 Purchased bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 11 Code int 4 10 0 0 1 NULL
dbo Customers 12 AffCode nvarchar 40 0 0 1 0 NULL
dbo Customers 13 ParkDomain nvarchar 200 0 0 1 0 NULL
dbo Expenses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Expenses 2 Amount decimal 9 18 2 0 0 NULL
dbo Expenses 3 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Expenses 4 Title nvarchar -1 0 0 1 0 NULL
dbo Expenses 5 Comment nvarchar -1 0 0 1 0 NULL
dbo Expenses 6 CostDate datetime2 8 27 7 0 0 NULL
dbo Expenses 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Expenses 8 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo IceReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IceReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IceReport 4 Price decimal 9 18 2 0 0 NULL
dbo IceReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IceReport 6 ReportID nvarchar 100 0 0 1 0 NULL
dbo IceReport 7 Status nvarchar 200 0 0 1 0 NULL
dbo IceReport 8 IceReportJson nvarchar 2000 0 0 1 0 NULL
dbo IceReport 9 Errors nvarchar 400 0 0 1 0 NULL
dbo IceReport 10 MemberId bigint 8 19 0 0 0 NULL
dbo IceReport 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 12 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IceReport 13 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IranValidityReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IranValidityReport 4 Price decimal 9 18 2 0 0 NULL
dbo IranValidityReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IranValidityReport 6 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 7 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 8 ReportID nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 9 Status int 4 10 0 0 0 NULL
dbo IranValidityReport 10 IranValidityReportJson nvarchar 2000 0 0 1 0 NULL
dbo IranValidityReport 11 Messages nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 12 MemberId bigint 8 19 0 0 0 NULL
dbo IranValidityReport 13 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 14 GradeNumber int 4 10 0 0 0 ((0))
dbo LoanAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 6 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 8 AuthorizationItemId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo LoanAuthorizationItems 9 IsPrimary bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo LoanContacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 2 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 4 Share decimal 9 18 2 0 0 NULL
dbo LoanContacts 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 2 Title nvarchar 100 0 0 0 0 NULL
dbo LoanRequestStatuses 3 StepCategory int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 4 Changable bit 1 1 0 0 0 NULL
dbo LoanRequestStatuses 5 Order int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 6 SmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo LoanRequestStatuses 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 8 SystemRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 9 StatusGroup int 4 10 0 0 0 ((0))
dbo LoanRequestStatuses 10 SystemAgentRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 11 AllowNewRequest bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Loans 2 Title nvarchar 200 0 0 1 0 NULL
dbo Loans 3 Code int 4 10 0 0 0 ((0))
dbo Loans 4 DelayPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 5 EarlyPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 6 ProfitPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 7 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Loans 8 IsSponsored bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 10 IsSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 11 FileName nvarchar 200 0 0 1 0 NULL
dbo Loans 12 IncludePlan bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 13 PlanHtml nvarchar -1 0 0 1 0 NULL
dbo Loans 14 PlanShortDescription nvarchar 2000 0 0 1 0 NULL
dbo Loans 15 PlanTitle nvarchar 200 0 0 1 0 NULL
dbo Loans 18 MaxAmount decimal 9 18 2 0 0 ((0.0))
dbo Loans 19 MaxMonthGap int 4 10 0 0 0 ((0))
dbo Loans 20 AllowedInstallments nvarchar -1 0 0 1 0 NULL
dbo Loans 21 CostsJson nvarchar -1 0 0 1 0 NULL
dbo Loans 22 Disable bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 23 DisableText nvarchar 200 0 0 1 0 NULL
dbo Loans 24 HasSponsore bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 25 DefaultSponsoreCheckoutDays int 4 10 0 0 0 ((0))
dbo MemberPurchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberPurchases 2 PaymentStep int 4 10 0 0 0 NULL
dbo MemberPurchases 3 OnlinePaymentGateway int 4 10 0 0 0 NULL
dbo MemberPurchases 4 UserId bigint 8 19 0 0 0 NULL
dbo MemberPurchases 5 UserLoanPaymentId uniqueidentifier 16 0 0 1 0 NULL
dbo MemberPurchases 6 Amount decimal 9 18 2 0 0 NULL
dbo MemberPurchases 7 StartDate datetime2 8 27 7 0 0 NULL
dbo MemberPurchases 8 Description nvarchar 400 0 0 1 0 NULL
dbo MemberPurchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo MemberPurchases 14 SepJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 15 ZarinPalJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 16 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo MemberPurchases 17 MemberPurchaseType int 4 10 0 0 0 ((0))
dbo MemberPurchases 18 NextPayJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 19 Code int 4 10 0 0 1 NULL
dbo MemberPurchases 20 IPGParsianJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 21 CreatorUserId bigint 8 19 0 1 0 NULL
dbo MemberPurchases 22 SadadJson nvarchar -1 0 0 1 0 NULL
dbo OffDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OffDate 2 Date datetime2 8 27 7 0 0 NULL
dbo OffDate 3 Title nvarchar 200 0 0 1 0 NULL
dbo OffDate 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 2 Amount decimal 9 18 2 0 0 NULL
dbo OnlineMoneyTransfer 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 4 OnlineMoneyTransferStep int 4 10 0 0 0 NULL
dbo OnlineMoneyTransfer 5 From nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 6 To nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 7 OTP nvarchar 20 0 0 1 0 NULL
dbo OnlineMoneyTransfer 8 OTPGenerateDateTime datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 9 OurTraceNumber nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 10 Cif nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 11 IsSuccess bit 1 1 0 0 0 NULL
dbo OnlineMoneyTransfer 12 EFardaJson nvarchar -1 0 0 1 0 NULL
dbo OnlineMoneyTransfer 13 TransactionId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 14 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 15 OnlineMoneyTransferPanelId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 16 ToName nvarchar -1 0 0 1 0 NULL
dbo Purchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 2 ProductType int 4 10 0 0 0 NULL
dbo Purchases 3 PaymentStep int 4 10 0 0 0 NULL
dbo Purchases 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Purchases 5 UserId bigint 8 19 0 0 0 NULL
dbo Purchases 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 7 Amount decimal 9 18 2 0 0 NULL
dbo Purchases 8 StartDate datetime2 8 27 7 0 0 NULL
dbo Purchases 9 Description nvarchar 400 0 0 1 0 NULL
dbo Purchases 10 ZarinPalAuthority nvarchar 100 0 0 1 0 NULL
dbo Purchases 11 ZarinPalRefId nvarchar -1 0 0 1 0 NULL
dbo Purchases 12 ZarinPalStatus int 4 10 0 0 0 NULL
dbo Purchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo Purchases 14 AffCode nvarchar 40 0 0 1 0 NULL
dbo Purchases 15 LoanCount int 4 10 0 0 0 ((0))
dbo SmsPatterns 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 2 Title nvarchar 400 0 0 1 0 NULL
dbo SmsPatterns 3 Pattern nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 4 IsSystem bit 1 1 0 0 0 NULL
dbo SmsPatterns 5 Status int 4 10 0 0 0 NULL
dbo SmsPatterns 6 RejectReason nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 8 IsPatternBase bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo SmsPatterns 9 PatternBaseCode nvarchar 40 0 0 1 0 NULL
dbo SmsPatterns 10 SmsPatternPanel int 4 10 0 0 0 ((0))
dbo SmsPatterns 11 Category int 4 10 0 0 0 ((0))
dbo SubAgentTransactions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SubAgentTransactions 2 Amount decimal 9 18 2 0 0 NULL
dbo SubAgentTransactions 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo SubAgentTransactions 4 PaymentMethod int 4 10 0 0 0 NULL
dbo SubAgentTransactions 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo SubAgentTransactions 6 Description nvarchar 1000 0 0 1 0 NULL
dbo SubAgentTransactions 7 SavedBy nvarchar 200 0 0 1 0 NULL
dbo SubAgentTransactions 8 FileName nvarchar 100 0 0 1 0 NULL
dbo SubAgentTransactions 9 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo SubAgentTransactions 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 3 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 4 Share decimal 9 18 2 0 0 NULL
dbo UserLoanContact 5 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanContact 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 7 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanPaymentRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 2 UserLoanPaymentId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 3 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 4 PaymentDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPaymentRequests 6 MemberDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 7 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 8 Status int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 9 PaymentMethod int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 10 TrackNumber nvarchar 100 0 0 1 0 NULL
dbo UserLoanPaymentRequests 11 AdminAcceptorId bigint 8 19 0 1 0 NULL
dbo UserLoanPaymentRequests 12 AdminAcceptDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 13 AffectOnMainPayment bit 1 1 0 0 0 NULL
dbo UserLoanPaymentRequests 14 FileName nvarchar 100 0 0 1 0 NULL
dbo UserLoanPayments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 3 InstallmentNumber int 4 10 0 0 0 NULL
dbo UserLoanPayments 4 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPayments 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPayments 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanPayments 9 DelayDay int 4 10 0 0 0 ((0))
dbo UserLoanPayments 10 DelayPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 11 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 12 GoldRate float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 13 GoldWeight float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 14 PaymentMethod int 4 10 0 0 0 ((0))
dbo UserLoanPayments 15 IsGoldCheckouted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 16 Code int 4 10 0 0 1 NULL
dbo UserLoanPayments 17 SentDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 18 InstallmentAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 19 SentOverDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequestAuthorizationItemAttachments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 2 UserLoanRequestAuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 3 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 4 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 5 AttachmentByAdmin bit 1 1 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 2 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 3 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 4 CreateDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 5 LastChangeDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 6 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 7 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 8 AdminDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 9 Status int 4 10 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 10 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 11 AttachmentByAdmin bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequests 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 4 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanRequests 6 Comment nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 7 AdminDescriptionPrivate nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 9 Month int 4 10 0 0 0 NULL
dbo UserLoanRequests 10 Year int 4 10 0 0 0 NULL
dbo UserLoanRequests 11 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo UserLoanRequests 12 InstallmentCount int 4 10 0 0 0 ((0))
dbo UserLoanRequests 13 MonthGap int 4 10 0 0 0 ((0))
dbo UserLoanRequests 14 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoanRequests 15 Code int 4 10 0 0 1 NULL
dbo UserLoanRequests 16 Installment decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 18 IsPhysicalDocsDelivered bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequests 19 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequests 20 SponsoreDueDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanRequests 21 StatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 22 AgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 23 ChargeType int 4 10 0 0 0 ((0))
dbo UserLoanRequests 24 SponsoreAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 25 LockedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequestStatusHistories 3 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 4 DateTime datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestStatusHistories 5 FromStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 6 FromAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 7 ToStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 8 ToAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 4 StartDate datetime2 8 27 7 0 0 NULL
dbo UserLoans 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoans 6 Installment decimal 9 18 2 0 0 NULL
dbo UserLoans 7 Month int 4 10 0 0 0 NULL
dbo UserLoans 8 Paid decimal 9 18 2 0 0 NULL
dbo UserLoans 9 Remain decimal 9 18 2 0 0 NULL
dbo UserLoans 10 CheckoutDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 11 IsCheckouted bit 1 1 0 1 0 NULL
dbo UserLoans 12 Code int 4 10 0 0 1 NULL
dbo UserLoans 13 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoans 14 MonthGap int 4 10 0 0 0 ((1))
dbo UserLoans 15 PayableAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 16 CustomerPurchasePlanId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 17 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 18 UserLoanRequestId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 19 AgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 20 AgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 21 SubAgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 22 SubAgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 23 SubAgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 24 DepositChargeDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 25 PreDepositAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanSponsoreDueDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 3 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanSponsoreDueDate 4 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanSponsoreDueDate 5 Description nvarchar 1000 0 0 1 0 NULL
dbo UserLoanSponsoreDueDate 6 IsCheckouted bit 1 1 0 0 0 NULL
dbo UserLoanSponsoreDueDate 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 8 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserSavedMonies 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserSavedMonies 2 MemberId bigint 8 19 0 0 0 NULL
dbo UserSavedMonies 3 Description nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 4 Amount decimal 9 18 2 0 0 NULL
dbo UserSavedMonies 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserSavedMonies 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo VisitorLogs 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo VisitorLogs 2 Date datetime2 8 27 7 0 0 NULL
dbo VisitorLogs 3 IpAddress nvarchar 100 0 0 1 0 NULL
dbo VisitorLogs 4 UserAgent nvarchar 400 0 0 1 0 NULL
dbo VisitorLogs 5 Mrk nvarchar -1 0 0 1 0 NULL
dbo Withdraws 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Withdraws 2 Amount decimal 9 18 2 0 0 NULL
dbo Withdraws 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo Withdraws 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Withdraws 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo Withdraws 6 IsUnknown bit 1 1 0 0 0 NULL
dbo Withdraws 7 GoldWeight float 8 53 0 0 0 NULL
dbo Withdraws 8 GoldRate float 8 53 0 0 0 NULL
dbo Withdraws 9 Description nvarchar -1 0 0 1 0 NULL
dbo Withdraws 10 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Withdraws 11 WeightBalance float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Withdraws 12 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Withdraws 13 SponsoredLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 14 AgentId bigint 8 19 0 1 0 NULL
dbo Withdraws 15 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 16 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 17 UserLoanContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 18 FileName nvarchar 100 0 0 1 0 NULL
dbo Withdraws 19 SuccessfullOnlineMoneyTransferId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 20 CustomerMarketerCommissionId uniqueidentifier 16 0 0 1 0 NULL
HangFire AggregatedCounter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire AggregatedCounter 3 Value bigint 8 19 0 0 0 NULL
HangFire AggregatedCounter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Counter 3 Value int 4 10 0 0 0 NULL
HangFire Counter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 5 Id bigint 8 19 0 0 1 NULL
HangFire Hash 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Hash 3 Field nvarchar 200 0 0 0 0 NULL
HangFire Hash 4 Value nvarchar -1 0 0 1 0 NULL
HangFire Hash 5 ExpireAt datetime2 8 27 7 1 0 NULL
HangFire Job 1 Id bigint 8 19 0 0 1 NULL
HangFire Job 2 StateId bigint 8 19 0 1 0 NULL
HangFire Job 3 StateName nvarchar 40 0 0 1 0 NULL
HangFire Job 4 InvocationData nvarchar -1 0 0 0 0 NULL
HangFire Job 5 Arguments nvarchar -1 0 0 0 0 NULL
HangFire Job 6 CreatedAt datetime 8 23 3 0 0 NULL
HangFire Job 7 ExpireAt datetime 8 23 3 1 0 NULL
HangFire JobParameter 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobParameter 3 Name nvarchar 80 0 0 0 0 NULL
HangFire JobParameter 4 Value nvarchar -1 0 0 1 0 NULL
HangFire JobQueue 1 Id bigint 8 19 0 0 1 NULL
HangFire JobQueue 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobQueue 3 Queue nvarchar 100 0 0 0 0 NULL
HangFire JobQueue 4 FetchedAt datetime 8 23 3 1 0 NULL
HangFire List 1 Id bigint 8 19 0 0 1 NULL
HangFire List 2 Key nvarchar 200 0 0 0 0 NULL
HangFire List 3 Value nvarchar -1 0 0 1 0 NULL
HangFire List 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Schema 1 Version int 4 10 0 0 0 NULL
HangFire Server 1 Id nvarchar 400 0 0 0 0 NULL
HangFire Server 2 Data nvarchar -1 0 0 1 0 NULL
HangFire Server 3 LastHeartbeat datetime 8 23 3 0 0 NULL
HangFire Set 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Set 3 Score float 8 53 0 0 0 NULL
HangFire Set 4 Value nvarchar 512 0 0 0 0 NULL
HangFire Set 5 ExpireAt datetime 8 23 3 1 0 NULL
HangFire State 1 Id bigint 8 19 0 0 1 NULL
HangFire State 2 JobId bigint 8 19 0 0 0 NULL
HangFire State 3 Name nvarchar 40 0 0 0 0 NULL
HangFire State 4 Reason nvarchar 200 0 0 1 0 NULL
HangFire State 5 CreatedAt datetime 8 23 3 0 0 NULL
HangFire State 6 Data nvarchar -1 0 0 1 0 NULL
```

### PRIMARY AND UNIQUE KEYS

```text
schema_name table_name index_name is_primary_key is_unique key_ordinal column_name
----------- ---------- ---------- -------------- --------- ----------- -----------
dbo __EFMigrationsHistory PK___EFMigrationsHistory 1 1 1 MigrationId
dbo AffiliateCommissions PK_AffiliateCommissions 1 1 1 Id
dbo AgentLoanAuthorizationItem PK_AgentLoanAuthorizationItem 1 1 1 Id
dbo AgentLoans PK_AgentLoans 1 1 1 Id
dbo AppSettings PK_AppSettings 1 1 1 Id
dbo AppSms PK_AppSms 1 1 1 Id
dbo AspNetRoleClaims PK_AspNetRoleClaims 1 1 1 Id
dbo AspNetRoles PK_AspNetRoles 1 1 1 Id
dbo AspNetRoles RoleNameIndex 0 1 1 NormalizedName
dbo AspNetUserClaims PK_AspNetUserClaims 1 1 1 Id
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 1 LoginProvider
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 2 ProviderKey
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 1 UserId
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 2 RoleId
dbo AspNetUsers PK_AspNetUsers 1 1 1 Id
dbo AspNetUsers UserNameIndex 0 1 1 NormalizedUserName
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 1 UserId
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 2 LoginProvider
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 3 Name
dbo Assurance PK_Assurance 1 1 1 Id
dbo AuthorizationItem PK_AuthorizationItem 1 1 1 Id
dbo Consultants PK_Consultants 1 1 1 Id
dbo Contacts PK_Contacts 1 1 1 Id
dbo CustomerMarketerCommissions PK_CustomerMarketerCommissions 1 1 1 Id
dbo CustomerPurchasePlan PK_CustomerPurchasePlan 1 1 1 Id
dbo Customers PK_Customers 1 1 1 Id
dbo Expenses PK_Expenses 1 1 1 Id
dbo IceReport PK_IceReport 1 1 1 Id
dbo IranValidityReport PK_IranValidityReport 1 1 1 Id
dbo LoanAuthorizationItems PK_LoanAuthorizationItems 1 1 1 Id
dbo LoanContacts PK_LoanContacts 1 1 1 Id
dbo LoanRequestStatuses PK_LoanRequestStatuses 1 1 1 Id
dbo Loans PK_Loans 1 1 1 Id
dbo MemberPurchases PK_MemberPurchases 1 1 1 Id
dbo OffDate PK_OffDate 1 1 1 Id
dbo OnlineMoneyTransfer PK_OnlineMoneyTransfer 1 1 1 Id
dbo Purchases PK_Purchases 1 1 1 Id
dbo SmsPatterns PK_SmsPatterns 1 1 1 Id
dbo SubAgentTransactions PK_SubAgentTransactions 1 1 1 Id
dbo UserLoanContact PK_UserLoanContact 1 1 1 Id
dbo UserLoanPaymentRequests PK_UserLoanPaymentRequests 1 1 1 Id
dbo UserLoanPayments PK_UserLoanPayments 1 1 1 Id
dbo UserLoanRequestAuthorizationItemAttachments PK_UserLoanRequestAuthorizationItemAttachments 1 1 1 Id
dbo UserLoanRequestAuthorizationItems PK_UserLoanRequestAuthorizationItems 1 1 1 Id
dbo UserLoanRequests PK_UserLoanRequests 1 1 1 Id
dbo UserLoanRequestStatusHistories PK_UserLoanRequestStatusHistories 1 1 1 Id
dbo UserLoans PK_UserLoans 1 1 1 Id
dbo UserLoanSponsoreDueDate PK_UserLoanSponsoreDueDate 1 1 1 Id
dbo UserSavedMonies PK_UserSavedMonies 1 1 1 Id
dbo VisitorLogs PK_VisitorLogs 1 1 1 Id
dbo Withdraws PK_Withdraws 1 1 1 Id
HangFire AggregatedCounter PK_HangFire_CounterAggregated 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 2 Id
HangFire Hash PK_HangFire_Hash 1 1 1 Key
HangFire Hash PK_HangFire_Hash 1 1 2 Field
HangFire Job PK_HangFire_Job 1 1 1 Id
HangFire JobParameter PK_HangFire_JobParameter 1 1 1 JobId
HangFire JobParameter PK_HangFire_JobParameter 1 1 2 Name
HangFire JobQueue PK_HangFire_JobQueue 1 1 1 Queue
HangFire JobQueue PK_HangFire_JobQueue 1 1 2 Id
HangFire List PK_HangFire_List 1 1 1 Key
HangFire List PK_HangFire_List 1 1 2 Id
HangFire Schema PK_HangFire_Schema 1 1 1 Version
HangFire Server PK_HangFire_Server 1 1 1 Id
HangFire Set PK_HangFire_Set 1 1 1 Key
HangFire Set PK_HangFire_Set 1 1 2 Value
HangFire State PK_HangFire_State 1 1 1 JobId
HangFire State PK_HangFire_State 1 1 2 Id
```

### FOREIGN KEYS

```text
source_table source_column target_table target_column constraint_name delete_referential_action_desc update_referential_action_desc is_disabled
------------ ------------- ------------ ------------- --------------- ------------------------------ ------------------------------ -----------
dbo.AffiliateCommissions UserId dbo.AspNetUsers Id FK_AffiliateCommissions_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AffiliateCommissions PurchaseId dbo.Purchases Id FK_AffiliateCommissions_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem AuthorizationItemId dbo.AuthorizationItem Id FK_AgentLoanAuthorizationItem_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem CustomerId dbo.Customers Id FK_AgentLoanAuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem LoanId dbo.Loans Id FK_AgentLoanAuthorizationItem_Loans_LoanId CASCADE NO_ACTION 0
dbo.AgentLoans AgentId dbo.AspNetUsers Id FK_AgentLoans_AspNetUsers_AgentId CASCADE NO_ACTION 0
dbo.AgentLoans ContactId dbo.Contacts Id FK_AgentLoans_Contacts_ContactId CASCADE NO_ACTION 0
dbo.AgentLoans CustomerId dbo.Customers Id FK_AgentLoans_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AgentLoans LoanId dbo.Loans Id FK_AgentLoans_Loans_LoanId CASCADE NO_ACTION 0
dbo.AppSettings CustomerId dbo.Customers Id FK_AppSettings_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AppSettings BeforeDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_BeforeDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DueDateRememberSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DueDateRememberSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings LoginSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_LoginSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings OverDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_OverDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThanksPaymentSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThanksPaymentSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSms CustomerId dbo.Customers Id FK_AppSms_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetRoleClaims RoleId dbo.AspNetRoles Id FK_AspNetRoleClaims_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserClaims UserId dbo.AspNetUsers Id FK_AspNetUserClaims_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserLogins UserId dbo.AspNetUsers Id FK_AspNetUserLogins_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserRoles RoleId dbo.AspNetRoles Id FK_AspNetUserRoles_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserRoles UserId dbo.AspNetUsers Id FK_AspNetUserRoles_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUsers AgentId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerMarketerId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_CustomerMarketerId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerId dbo.Customers Id FK_AspNetUsers_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetUserTokens UserId dbo.AspNetUsers Id FK_AspNetUserTokens_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.Assurance UserLoanId dbo.UserLoans Id FK_Assurance_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.AuthorizationItem CustomerId dbo.Customers Id FK_AuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Contacts CustomerId dbo.Customers Id FK_Contacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.CustomerMarketerCommissions MarketerId dbo.AspNetUsers Id FK_CustomerMarketerCommissions_AspNetUsers_MarketerId CASCADE NO_ACTION 0
dbo.CustomerMarketerCommissions UserLoanId dbo.UserLoans Id FK_CustomerMarketerCommissions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.CustomerPurchasePlan CustomerId dbo.Customers Id FK_CustomerPurchasePlan_Customers_CustomerId CASCADE NO_ACTION 0
dbo.CustomerPurchasePlan PurchaseId dbo.Purchases Id FK_CustomerPurchasePlan_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.Expenses CustomerId dbo.Customers Id FK_Expenses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.IceReport MemberId dbo.AspNetUsers Id FK_IceReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IceReport CustomerId dbo.Customers Id FK_IceReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.IranValidityReport MemberId dbo.AspNetUsers Id FK_IranValidityReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IranValidityReport CustomerId dbo.Customers Id FK_IranValidityReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_LoanAuthorizationItems_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems CustomerId dbo.Customers Id FK_LoanAuthorizationItems_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems LoanId dbo.Loans Id FK_LoanAuthorizationItems_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanContacts ContactId dbo.Contacts Id FK_LoanContacts_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.LoanContacts CustomerId dbo.Customers Id FK_LoanContacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanContacts LoanId dbo.Loans Id FK_LoanContacts_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses CustomerId dbo.Customers Id FK_LoanRequestStatuses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses SmsPatternId dbo.SmsPatterns Id FK_LoanRequestStatuses_SmsPatterns_SmsPatternId NO_ACTION NO_ACTION 0
dbo.Loans CustomerId dbo.Customers Id FK_Loans_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.MemberPurchases CreatorUserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_CreatorUserId NO_ACTION NO_ACTION 0
dbo.MemberPurchases UserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.MemberPurchases UserLoanPaymentId dbo.UserLoanPayments Id FK_MemberPurchases_UserLoanPayments_UserLoanPaymentId NO_ACTION NO_ACTION 0
dbo.OffDate CustomerId dbo.Customers Id FK_OffDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer CustomerId dbo.Customers Id FK_OnlineMoneyTransfer_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer TransactionId dbo.Withdraws Id FK_OnlineMoneyTransfer_Withdraws_TransactionId NO_ACTION NO_ACTION 0
dbo.Purchases UserId dbo.AspNetUsers Id FK_Purchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.Purchases CustomerId dbo.Customers Id FK_Purchases_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SmsPatterns CustomerId dbo.Customers Id FK_SmsPatterns_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions CustomerId dbo.Customers Id FK_SubAgentTransactions_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions UserLoanId dbo.UserLoans Id FK_SubAgentTransactions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.UserLoanContact ContactId dbo.Contacts Id FK_UserLoanContact_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.UserLoanContact CustomerId dbo.Customers Id FK_UserLoanContact_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanContact UserLoanId dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanContact UserLoanId1 dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentRequests AdminAcceptorId dbo.AspNetUsers Id FK_UserLoanPaymentRequests_AspNetUsers_AdminAcceptorId NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentRequests UserLoanPaymentId dbo.UserLoanPayments Id FK_UserLoanPaymentRequests_UserLoanPayments_UserLoanPaymentId CASCADE NO_ACTION 0
dbo.UserLoanPayments UserLoanId dbo.UserLoans Id FK_UserLoanPayments_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestAuthorizationItemAttachments UserLoanRequestAuthorizationItemId dbo.UserLoanRequestAuthorizationItems Id FK_UserLoanRequestAuthorizationItemAttachments_UserLoanRequestAuthorizationItems_UserLoanRequestAuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_UserLoanRequestAuthorizationItems_AuthorizationItem_AuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestAuthorizationItems_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests AgentId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests UserId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequests AgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_AgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests StatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_StatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests LoanId dbo.Loans Id FK_UserLoanRequests_Loans_LoanId CASCADE NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserId dbo.AspNetUsers Id FK_UserLoanRequestStatusHistories_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestStatusHistories_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoans AgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoans SubAgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_SubAgentId NO_ACTION NO_ACTION 0
dbo.UserLoans UserId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoans CustomerPurchasePlanId dbo.CustomerPurchasePlan Id FK_UserLoans_CustomerPurchasePlan_CustomerPurchasePlanId NO_ACTION NO_ACTION 0
dbo.UserLoans LoanId dbo.Loans Id FK_UserLoans_Loans_LoanId NO_ACTION NO_ACTION 0
dbo.UserLoans UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoans_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate CustomerId dbo.Customers Id FK_UserLoanSponsoreDueDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId1 dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserSavedMonies MemberId dbo.AspNetUsers Id FK_UserSavedMonies_AspNetUsers_MemberId CASCADE NO_ACTION 0
dbo.Withdraws AgentId dbo.AspNetUsers Id FK_Withdraws_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.Withdraws ContactId dbo.Contacts Id FK_Withdraws_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerMarketerCommissionId dbo.CustomerMarketerCommissions Id FK_Withdraws_CustomerMarketerCommissions_CustomerMarketerCommissionId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerId dbo.Customers Id FK_Withdraws_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Withdraws SponsoredLoanId dbo.Loans Id FK_Withdraws_Loans_SponsoredLoanId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanContactId dbo.UserLoanContact Id FK_Withdraws_UserLoanContact_UserLoanContactId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanId dbo.UserLoans Id FK_Withdraws_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
HangFire.JobParameter JobId HangFire.Job Id FK_HangFire_JobParameter_Job CASCADE CASCADE 0
HangFire.State JobId HangFire.Job Id FK_HangFire_State_Job CASCADE CASCADE 0
```

### CHECK CONSTRAINTS

```text
schema_name table_name constraint_name definition is_disabled
----------- ---------- --------------- ---------- -----------
```

### TOTALS

```text
table_count column_count foreign_key_count check_constraint_count primary_key_count
----------- ------------ ----------------- ---------------------- -----------------
56 573 99 0 56
```

## vamcityc_transferDb_import_20261028

### TABLE ROW COUNTS

```text
schema_name table_name row_count
----------- ---------- ---------
OnlineMoneyTransfer __EFMigrationsHistory 1
OnlineMoneyTransfer AspNetRoleClaims 0
OnlineMoneyTransfer AspNetRoles 1
OnlineMoneyTransfer AspNetUserClaims 0
OnlineMoneyTransfer AspNetUserLogins 0
OnlineMoneyTransfer AspNetUserRoles 1
OnlineMoneyTransfer AspNetUsers 1
OnlineMoneyTransfer AspNetUserTokens 0
OnlineMoneyTransfer Client 1
OnlineMoneyTransfer RefreshToken 1
OnlineMoneyTransfer Settings 0
OnlineMoneyTransfer Transfer 23
```

### ALL COLUMNS

```text
schema_name table_name column_id column_name data_type max_length precision scale is_nullable is_identity default_definition
----------- ---------- --------- ----------- --------- ---------- --------- ----- ----------- ----------- ------------------
OnlineMoneyTransfer __EFMigrationsHistory 1 MigrationId nvarchar 300 0 0 0 0 NULL
OnlineMoneyTransfer __EFMigrationsHistory 2 ProductVersion nvarchar 64 0 0 0 0 NULL
OnlineMoneyTransfer AspNetRoleClaims 1 Id int 4 10 0 0 1 NULL
OnlineMoneyTransfer AspNetRoleClaims 2 RoleId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetRoleClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetRoleClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetRoles 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetRoles 2 DisplayName nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer AspNetRoles 3 IsSystem bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetRoles 4 Name nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetRoles 5 NormalizedName nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetRoles 6 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUserClaims 1 Id int 4 10 0 0 1 NULL
OnlineMoneyTransfer AspNetUserClaims 2 UserId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUserClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUserLogins 1 LoginProvider nvarchar 900 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserLogins 2 ProviderKey nvarchar 900 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserLogins 3 ProviderDisplayName nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUserLogins 4 UserId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserRoles 1 UserId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserRoles 2 RoleId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 2 FirstName nvarchar 200 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 3 LastName nvarchar 200 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 4 IsActive bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 5 ImageFileName nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 6 NationalCode nvarchar 20 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 7 UserName nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 8 NormalizedUserName nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 9 Email nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 10 NormalizedEmail nvarchar 512 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 11 EmailConfirmed bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 12 PasswordHash nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 13 SecurityStamp nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 14 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 15 PhoneNumber nvarchar 40 0 0 1 0 NULL
OnlineMoneyTransfer AspNetUsers 16 PhoneNumberConfirmed bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 17 TwoFactorEnabled bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 18 LockoutEnd datetimeoffset 10 34 7 1 0 NULL
OnlineMoneyTransfer AspNetUsers 19 LockoutEnabled bit 1 1 0 0 0 NULL
OnlineMoneyTransfer AspNetUsers 20 AccessFailedCount int 4 10 0 0 0 NULL
OnlineMoneyTransfer AspNetUserTokens 1 UserId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserTokens 2 LoginProvider nvarchar 900 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserTokens 3 Name nvarchar 900 0 0 0 0 NULL
OnlineMoneyTransfer AspNetUserTokens 4 Value nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer Client 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer Client 2 Name nvarchar 200 0 0 1 0 NULL
OnlineMoneyTransfer Client 3 ValidIps nvarchar 400 0 0 1 0 NULL
OnlineMoneyTransfer Client 4 ValidMobile nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Client 5 UserName nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Client 6 PasswordHash nvarchar 1000 0 0 1 0 NULL
OnlineMoneyTransfer Client 7 IsActive bit 1 1 0 0 0 NULL
OnlineMoneyTransfer RefreshToken 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer RefreshToken 2 UserId uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer RefreshToken 3 Token nvarchar 900 0 0 1 0 NULL
OnlineMoneyTransfer RefreshToken 4 Expires datetime2 8 27 7 0 0 NULL
OnlineMoneyTransfer RefreshToken 5 Created datetime2 8 27 7 0 0 NULL
OnlineMoneyTransfer RefreshToken 6 Revoked datetime2 8 27 7 1 0 NULL
OnlineMoneyTransfer Settings 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer Settings 2 Key nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer Settings 3 Value nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer Settings 4 ApplicationType int 4 10 0 1 0 NULL
OnlineMoneyTransfer Transfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
OnlineMoneyTransfer Transfer 2 Amount decimal 9 18 2 0 0 NULL
OnlineMoneyTransfer Transfer 3 CreateDate datetime2 8 27 7 0 0 NULL
OnlineMoneyTransfer Transfer 4 From nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 5 To nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 6 ToName nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 7 OTP nvarchar 20 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 8 OTPGenerateDateTime datetime2 8 27 7 0 0 NULL
OnlineMoneyTransfer Transfer 9 TransferStep int 4 10 0 0 0 NULL
OnlineMoneyTransfer Transfer 10 ClientTraceNumber nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 11 Cif nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 12 IsSuccess bit 1 1 0 0 0 NULL
OnlineMoneyTransfer Transfer 13 EFardaJson nvarchar -1 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 14 RequestFromIp nvarchar 100 0 0 1 0 NULL
OnlineMoneyTransfer Transfer 15 ClientId uniqueidentifier 16 0 0 0 0 NULL
```

### PRIMARY AND UNIQUE KEYS

```text
schema_name table_name index_name is_primary_key is_unique key_ordinal column_name
----------- ---------- ---------- -------------- --------- ----------- -----------
OnlineMoneyTransfer __EFMigrationsHistory PK___EFMigrationsHistory 1 1 1 MigrationId
OnlineMoneyTransfer AspNetRoleClaims PK_AspNetRoleClaims 1 1 1 Id
OnlineMoneyTransfer AspNetRoles PK_AspNetRoles 1 1 1 Id
OnlineMoneyTransfer AspNetRoles RoleNameIndex 0 1 1 NormalizedName
OnlineMoneyTransfer AspNetUserClaims PK_AspNetUserClaims 1 1 1 Id
OnlineMoneyTransfer AspNetUserLogins PK_AspNetUserLogins 1 1 1 LoginProvider
OnlineMoneyTransfer AspNetUserLogins PK_AspNetUserLogins 1 1 2 ProviderKey
OnlineMoneyTransfer AspNetUserRoles PK_AspNetUserRoles 1 1 1 UserId
OnlineMoneyTransfer AspNetUserRoles PK_AspNetUserRoles 1 1 2 RoleId
OnlineMoneyTransfer AspNetUsers PK_AspNetUsers 1 1 1 Id
OnlineMoneyTransfer AspNetUsers UserNameIndex 0 1 1 NormalizedUserName
OnlineMoneyTransfer AspNetUserTokens PK_AspNetUserTokens 1 1 1 UserId
OnlineMoneyTransfer AspNetUserTokens PK_AspNetUserTokens 1 1 2 LoginProvider
OnlineMoneyTransfer AspNetUserTokens PK_AspNetUserTokens 1 1 3 Name
OnlineMoneyTransfer Client PK_Client 1 1 1 Id
OnlineMoneyTransfer RefreshToken IX_RefreshToken_Token 0 1 1 Token
OnlineMoneyTransfer RefreshToken PK_RefreshToken 1 1 1 Id
OnlineMoneyTransfer Settings PK_Settings 1 1 1 Id
OnlineMoneyTransfer Transfer PK_Transfer 1 1 1 Id
```

### FOREIGN KEYS

```text
source_table source_column target_table target_column constraint_name delete_referential_action_desc update_referential_action_desc is_disabled
------------ ------------- ------------ ------------- --------------- ------------------------------ ------------------------------ -----------
OnlineMoneyTransfer.AspNetRoleClaims RoleId OnlineMoneyTransfer.AspNetRoles Id FK_AspNetRoleClaims_AspNetRoles_RoleId CASCADE NO_ACTION 0
OnlineMoneyTransfer.AspNetUserClaims UserId OnlineMoneyTransfer.AspNetUsers Id FK_AspNetUserClaims_AspNetUsers_UserId CASCADE NO_ACTION 0
OnlineMoneyTransfer.AspNetUserLogins UserId OnlineMoneyTransfer.AspNetUsers Id FK_AspNetUserLogins_AspNetUsers_UserId CASCADE NO_ACTION 0
OnlineMoneyTransfer.AspNetUserRoles RoleId OnlineMoneyTransfer.AspNetRoles Id FK_AspNetUserRoles_AspNetRoles_RoleId CASCADE NO_ACTION 0
OnlineMoneyTransfer.AspNetUserRoles UserId OnlineMoneyTransfer.AspNetUsers Id FK_AspNetUserRoles_AspNetUsers_UserId CASCADE NO_ACTION 0
OnlineMoneyTransfer.AspNetUserTokens UserId OnlineMoneyTransfer.AspNetUsers Id FK_AspNetUserTokens_AspNetUsers_UserId CASCADE NO_ACTION 0
OnlineMoneyTransfer.RefreshToken UserId OnlineMoneyTransfer.AspNetUsers Id FK_RefreshToken_AspNetUsers_UserId CASCADE NO_ACTION 0
OnlineMoneyTransfer.Transfer ClientId OnlineMoneyTransfer.Client Id FK_Transfer_Client_ClientId CASCADE NO_ACTION 0
```

### CHECK CONSTRAINTS

```text
schema_name table_name constraint_name definition is_disabled
----------- ---------- --------------- ---------- -----------
```

### TOTALS

```text
table_count column_count foreign_key_count check_constraint_count primary_key_count
----------- ------------ ----------------- ---------------------- -----------------
12 78 8 0 12
```

## vamcityc_vamcity_import_20261028

### TABLE ROW COUNTS

```text
schema_name table_name row_count
----------- ---------- ---------
dbo __EFMigrationsHistory 225
dbo AffiliateCommissions 0
dbo AgentFactorItem 23
dbo AgentFactors 25
dbo AgentLoanAuthorizationItem 141
dbo AgentLoans 924
dbo AgentMetaData 160
dbo AppEmails 5946
dbo AppInquirys 606
dbo AppSettings 2
dbo AppSms 138573
dbo AspNetRoleClaims 0
dbo AspNetRoles 8
dbo AspNetUserClaims 222
dbo AspNetUserLogins 0
dbo AspNetUserRoles 54625
dbo AspNetUsers 54628
dbo AspNetUserTokens 0
dbo AssuranceChequeItem 7
dbo AssuranceRequirementItems 16
dbo AssuranceRequirements 4
dbo Assurances 161
dbo AuthorizationItem 80
dbo BusinessAuthorizationItems 0
dbo Consultants 1
dbo Contacts 0
dbo CustomerMarketerCommissions 23
dbo CustomerOrders 548
dbo CustomerPurchasePlan 2
dbo Customers 2
dbo EmzameContractAuthorizationItems 0
dbo Expenses 0
dbo IceReport 56
dbo InquirySettings 0
dbo IranValidityReport 2762
dbo LoanAssuranceRequirements 9
dbo LoanAuthorizationItems 276
dbo LoanContacts 0
dbo LoanRequestStatuses 121
dbo Loans 112
dbo LoanTags 9
dbo MemberAuthorizationItemAttachments 0
dbo MemberAuthorizationItems 0
dbo MemberPurchases 6937
dbo OffDate 197
dbo OnlineMoneyTransfer 271
dbo Organization 3
dbo Product 0
dbo Purchases 2
dbo Reliability 0
dbo SiteContents 0
dbo SmsPatterns 55
dbo SubAgentTransactions 1
dbo Tags 9
dbo ThirdPartySettings 1
dbo ThirdPartyTransfer 1963
dbo ThirdPersonAssuranceAuthorizationItems 0
dbo TicketResponses 54661
dbo Tickets 54197
dbo UserLoanContact 0
dbo UserLoanPaymentOthers 223
dbo UserLoanPaymentRequests 133
dbo UserLoanPayments 29220
dbo UserLoanProduct 0
dbo UserLoanRequestAuthorizationItemAttachments 19347
dbo UserLoanRequestAuthorizationItems 19576
dbo UserLoanRequestProduct 0
dbo UserLoanRequests 17255
dbo UserLoanRequestSponsorHistory 0
dbo UserLoanRequestStatusHistories 49156
dbo UserLoans 1407
dbo UserLoanSponsoreDueDate 13
dbo UserRefahBeta 70
dbo UserSavedMonies 0
dbo VisitorLogs 11308
dbo WithdrawAgentFactor 11
dbo Withdraws 1494
HangFire AggregatedCounter 43
HangFire Counter 0
HangFire Hash 31
HangFire Job 97
HangFire JobParameter 364
HangFire JobQueue 0
HangFire List 0
HangFire Schema 1
HangFire Server 1
HangFire Set 4
HangFire State 2824
```

### ALL COLUMNS

```text
schema_name table_name column_id column_name data_type max_length precision scale is_nullable is_identity default_definition
----------- ---------- --------- ----------- --------- ---------- --------- ----- ----------- ----------- ------------------
dbo __EFMigrationsHistory 1 MigrationId nvarchar 300 0 0 0 0 NULL
dbo __EFMigrationsHistory 2 ProductVersion nvarchar 64 0 0 0 0 NULL
dbo AffiliateCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AffiliateCommissions 2 Amount int 4 10 0 0 0 NULL
dbo AffiliateCommissions 3 PaidToUser int 4 10 0 0 0 NULL
dbo AffiliateCommissions 4 Date datetime2 8 27 7 0 0 NULL
dbo AffiliateCommissions 5 Description nvarchar 1000 0 0 1 0 NULL
dbo AffiliateCommissions 6 UserId bigint 8 19 0 0 0 NULL
dbo AffiliateCommissions 7 PurchaseId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactorItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactorItem 2 AgentFactorId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactorItem 3 Product nvarchar 500 0 0 1 0 NULL
dbo AgentFactorItem 4 Payable decimal 9 18 2 0 0 NULL
dbo AgentFactorItem 5 Count decimal 9 18 2 0 0 NULL
dbo AgentFactorItem 6 Fee decimal 9 18 2 0 0 NULL
dbo AgentFactorItem 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactors 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactors 2 Code int 4 10 0 0 1 NULL
dbo AgentFactors 3 UserCode nvarchar 20 0 0 1 0 NULL
dbo AgentFactors 4 MemberId bigint 8 19 0 0 0 NULL
dbo AgentFactors 5 AgentId bigint 8 19 0 1 0 NULL
dbo AgentFactors 6 CreateAt datetime2 8 27 7 0 0 NULL
dbo AgentFactors 7 CheckoutType int 4 10 0 0 0 NULL
dbo AgentFactors 8 Amount decimal 9 18 2 0 0 NULL
dbo AgentFactors 9 Description nvarchar 2000 0 0 1 0 NULL
dbo AgentFactors 10 AdminDescription nvarchar 2000 0 0 1 0 NULL
dbo AgentFactors 11 AdminAcceptStatus int 4 10 0 0 0 NULL
dbo AgentFactors 12 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentFactors 13 CheckoutRequestDateTime datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AgentFactors 14 Commission decimal 9 18 2 0 0 ((0.0))
dbo AgentFactors 15 MemberPurchaseId uniqueidentifier 16 0 0 1 0 NULL
dbo AgentFactors 16 AgentFactorOnlinePaymentMethod int 4 10 0 0 0 ((0))
dbo AgentLoanAuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 2 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoanAuthorizationItem 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 2 AgentId bigint 8 19 0 0 0 NULL
dbo AgentLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 4 Percent decimal 9 18 2 0 0 NULL
dbo AgentLoans 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentLoans 6 DefaultCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 7 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo AgentLoans 8 ContactPercent decimal 9 18 2 0 0 NULL
dbo AgentLoans 11 ProductCheckoutDays tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AgentLoans 12 ProductPercent decimal 9 18 2 0 0 ((0.0))
dbo AgentLoans 13 OtherPercentsJson nvarchar -1 0 0 1 0 NULL
dbo AgentLoans 14 CashTitle nvarchar 200 0 0 1 0 NULL
dbo AgentLoans 15 ProductTitle nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AgentMetaData 2 SignaturesOwnerNames nvarchar 400 0 0 1 0 NULL
dbo AgentMetaData 3 ShomareSabt nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 4 ShenaseMelli nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 5 CompanyName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 6 AgentCategoryActivities nvarchar 400 0 0 1 0 NULL
dbo AgentMetaData 7 AgentType int 4 10 0 0 0 NULL
dbo AgentMetaData 8 UserId bigint 8 19 0 0 0 NULL
dbo AgentMetaData 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AgentMetaData 10 Status int 4 10 0 0 0 NULL
dbo AgentMetaData 11 RejectReason nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 12 LastAdminChangeDateTime datetime2 8 27 7 0 0 NULL
dbo AgentMetaData 13 CheckedBy nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 14 ThumbnailFileName nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 15 JavazKasbFileName nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 16 KartMelliFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 17 EjarenameFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 18 AsasnameFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 19 RoznameRasmiFileName nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 20 IsOnline bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AgentMetaData 21 IsPhysical bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AgentMetaData 22 SiteUrl nvarchar 200 0 0 1 0 NULL
dbo AgentMetaData 23 AgentFactorCommission decimal 9 18 2 0 0 ((0.0))
dbo AgentMetaData 24 MaxAgentFactorCommission decimal 9 18 2 0 0 ((0.0))
dbo AgentMetaData 25 UseDefaultCommission bit 1 1 0 0 0 (CONVERT([bit],(1)))
dbo AgentMetaData 26 PledgeChequeFileName nvarchar -1 0 0 1 0 NULL
dbo AgentMetaData 27 CanConvertRequestToLoan bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppEmails 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppEmails 2 Date datetime2 8 27 7 0 0 NULL
dbo AppEmails 3 Text nvarchar -1 0 0 1 0 NULL
dbo AppEmails 4 AppEmailType int 4 10 0 0 0 NULL
dbo AppEmails 5 To nvarchar 100 0 0 1 0 NULL
dbo AppEmails 6 PatternTitle nvarchar 200 0 0 1 0 NULL
dbo AppEmails 7 EmailPanel int 4 10 0 0 0 NULL
dbo AppEmails 8 EntityId uniqueidentifier 16 0 0 0 0 NULL
dbo AppEmails 9 EntityType nvarchar 100 0 0 1 0 NULL
dbo AppEmails 10 Tag nvarchar 200 0 0 1 0 NULL
dbo AppEmails 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AppInquirys 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppInquirys 2 Date datetime2 8 27 7 0 0 NULL
dbo AppInquirys 3 InquiryPanel int 4 10 0 0 0 NULL
dbo AppInquirys 4 AppInquiryType int 4 10 0 0 0 NULL
dbo AppInquirys 5 Price decimal 9 18 2 0 0 NULL
dbo AppInquirys 6 IsSuccess bit 1 1 0 0 0 NULL
dbo AppInquirys 7 PanelResultJson nvarchar -1 0 0 1 0 NULL
dbo AppInquirys 8 Result nvarchar -1 0 0 1 0 NULL
dbo AppInquirys 9 Key nvarchar 200 0 0 1 0 NULL
dbo AppInquirys 10 Tag nvarchar 200 0 0 1 0 NULL
dbo AppInquirys 11 MemberId bigint 8 19 0 1 0 NULL
dbo AppInquirys 12 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AppInquirys 13 MemberPrice decimal 9 18 2 0 0 ((0.0))
dbo AppSettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSettings 5 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo AppSettings 6 IsOnlinePaymentActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 7 OnlinePaymentGateway int 4 10 0 0 0 ((0))
dbo AppSettings 8 Shaba nvarchar 100 0 0 1 0 NULL
dbo AppSettings 9 ZarinpalMerchantCode nvarchar 400 0 0 1 0 NULL
dbo AppSettings 10 DueDateRememberSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 11 DueDatedRememberSmsTime time 5 16 7 1 0 NULL
dbo AppSettings 12 SmsCredit int 4 10 0 0 0 ((0))
dbo AppSettings 13 ThanksPaymentSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 14 AppendToWhichInstallment int 4 10 0 0 0 ((0))
dbo AppSettings 15 RoundCountNumber tinyint 1 3 0 0 0 (CONVERT([tinyint],(0)))
dbo AppSettings 16 OverDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 17 OverDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 18 SepTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 19 DashboardSettingsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 20 BeforeDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 21 IsDueDateSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 22 IsRememberSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 23 OverDueDayRemeberOnce bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 24 BeforeDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 25 DefaultSmsPanel int 4 10 0 0 0 ((0))
dbo AppSettings 26 MelliPayamakConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 27 KaveNegarConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 28 BankInfo nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 29 IceConfigJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 30 NextPayApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 31 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 32 IPGParsianLoginAccount nvarchar 400 0 0 1 0 NULL
dbo AppSettings 33 Address nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 34 Email nvarchar -1 0 0 1 0 NULL
dbo AppSettings 35 Phones nvarchar 400 0 0 1 0 NULL
dbo AppSettings 36 ThemeSettingsJson nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 37 DepositChargeDueDateStatuses nvarchar 2000 0 0 1 0 NULL
dbo AppSettings 38 SponsoreDueDateStatuses nvarchar -1 0 0 1 0 NULL
dbo AppSettings 39 LoginSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 40 RegisterSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 41 IranValidityConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 42 ApplicationLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 43 BusinessTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 44 EnamadLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 45 EtehadieLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 46 InstagramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 47 RubikaLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 48 SamandehiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 49 TelegramLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 50 WhatsappLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 51 ShopLink nvarchar 1000 0 0 1 0 NULL
dbo AppSettings 52 RegisterOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 53 AnjomanSenfiLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 54 AparatLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 55 ShopTitle nvarchar 500 0 0 1 0 NULL
dbo AppSettings 56 FinnoTechConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 57 KasboKarhayeInternetiTehranLink nvarchar 500 0 0 1 0 NULL
dbo AppSettings 58 BankGatewayRouterBaseUrl nvarchar -1 0 0 1 0 NULL
dbo AppSettings 59 ApiKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 60 ApiPassword nvarchar 100 0 0 1 0 NULL
dbo AppSettings 61 SadadMerchantId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 62 SadadTerminalId nvarchar -1 0 0 1 0 NULL
dbo AppSettings 63 SadadMerchantKey nvarchar -1 0 0 1 0 NULL
dbo AppSettings 64 WalletChargeSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 65 AgentOfficePhone nvarchar 400 0 0 1 0 NULL
dbo AppSettings 66 BeforeDueDateEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 67 BeforeDueDaysCount_Email int 4 10 0 0 0 ((0))
dbo AppSettings 68 DailyReportEmailTime time 5 16 7 1 0 NULL
dbo AppSettings 69 DefaultEmailPanel int 4 10 0 0 0 ((0))
dbo AppSettings 70 DueDateRememberEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 71 DueDatedRememberEmailTime time 5 16 7 1 0 NULL
dbo AppSettings 72 EmailConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 73 IsDailyReportEmailActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 74 IsDueDateEmailActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 75 IsRememberEmailActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 76 LoginEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 77 OverDueDateEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 78 OverDueDayRemeberOnce_Email bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 79 OverDueDaysCount_Email int 4 10 0 0 0 ((0))
dbo AppSettings 80 RegisterEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 81 RegisterOtpEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 82 ThanksPaymentEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 83 WalletChargeEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 84 RefahBetaConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 85 IPPanelConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 86 SiteTheme int 4 10 0 0 0 ((0))
dbo AppSettings 87 NewOrderEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 88 NewOrderSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 89 OtpRequiredInManualMemberRegistration bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 90 WebOneConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 91 PercentOfConsideringAsPaid tinyint 1 3 0 0 0 (CONVERT([tinyint],(50)))
dbo AppSettings 92 ShowSubmitFirstLoanRequestNotifInMemberPanel bit 1 1 0 0 0 (CONVERT([bit],(1)))
dbo AppSettings 93 NewUserLoanSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 94 PreventCreateLoanNonCurrentDate bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 95 WalletWithdrawNotificationSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 96 WalletWithdrawOtpEmailPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 97 WalletWithdrawOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 98 CalculatorType int 4 10 0 0 0 ((0))
dbo AppSettings 99 AgentFactorCommission decimal 9 18 2 0 0 ((0.0))
dbo AppSettings 100 AgentFactorOnlinePaymentGateway int 4 10 0 0 0 ((0))
dbo AppSettings 101 MaxAgentFactorCommission decimal 9 18 2 0 0 ((0.0))
dbo AppSettings 102 AgentFactorPaymentLinkSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 103 SepehrTerminalId bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo AppSettings 104 ApiIRConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 105 DefaultInquiryPanel int 4 10 0 0 0 ((0))
dbo AppSettings 106 InquiryCredit int 4 10 0 0 0 ((0))
dbo AppSettings 107 VerifyMobileByNationalCodeInRegister bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 108 DigitalSignLinkSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 109 DigitalSignCompleteSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 110 DigitalSignOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 111 IsMemberRegistrationDisabled bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 112 MemberCanChangeProfile bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 113 BaleConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 114 ThirdPersonDigitalSignCompleteSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 115 ThirdPersonDigitalSignLinkSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 116 ThirdPersonDigitalSignOtpSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 117 InquiryBankInRegister bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 118 InquiryPersonInfoInRegister bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 119 InquiryPostalAddressInRegister bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 120 EmzameConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 121 OverDueDayGapPeriod int 4 10 0 0 0 ((0))
dbo AppSettings 122 HafezPayamConfigJson nvarchar -1 0 0 1 0 NULL
dbo AppSettings 123 NewLoanRequestNotificationSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 124 NewLoanRequestNotificationSmsReceiptors nvarchar 100 0 0 1 0 NULL
dbo AppSettings 125 SendOverDueRememberToGuarantorSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 126 InquirySanaInRegister bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AppSettings 127 GuarantorOverDueDateSmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo AppSettings 128 GuarantorOverDueDaysCount int 4 10 0 0 0 ((0))
dbo AppSettings 129 ZibalMerchantCode nvarchar 200 0 0 1 0 NULL
dbo AppSms 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 2 Date datetime2 8 27 7 0 0 NULL
dbo AppSms 3 Text nvarchar 3000 0 0 1 0 NULL
dbo AppSms 4 Price decimal 9 18 2 0 0 NULL
dbo AppSms 5 AppSmsType int 4 10 0 0 0 NULL
dbo AppSms 6 To nvarchar 100 0 0 1 0 NULL
dbo AppSms 7 Status int 4 10 0 0 0 NULL
dbo AppSms 8 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AppSms 9 EntityId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo AppSms 10 EntityType nvarchar 100 0 0 1 0 NULL
dbo AppSms 11 SmsPatternTitle nvarchar 200 0 0 1 0 NULL
dbo AppSms 12 SmsPanel int 4 10 0 0 0 ((0))
dbo AppSms 13 DeliverCheckRetryCount int 4 10 0 0 0 ((0))
dbo AppSms 14 SMSKey nvarchar -1 0 0 1 0 NULL
dbo AppSms 15 Tag nvarchar 200 0 0 1 0 NULL
dbo AspNetRoleClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetRoleClaims 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetRoleClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetRoleClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetRoles 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetRoles 2 Name nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 3 NormalizedName nvarchar 512 0 0 1 0 NULL
dbo AspNetRoles 4 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 1 Id int 4 10 0 0 1 NULL
dbo AspNetUserClaims 2 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserClaims 3 ClaimType nvarchar -1 0 0 1 0 NULL
dbo AspNetUserClaims 4 ClaimValue nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 1 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 2 ProviderKey nvarchar 900 0 0 0 0 NULL
dbo AspNetUserLogins 3 ProviderDisplayName nvarchar -1 0 0 1 0 NULL
dbo AspNetUserLogins 4 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserRoles 2 RoleId bigint 8 19 0 0 0 NULL
dbo AspNetUsers 1 Id bigint 8 19 0 0 1 NULL
dbo AspNetUsers 2 FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 3 LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 4 Gender bit 1 1 0 0 0 NULL
dbo AspNetUsers 5 Address nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 6 Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 7 LastLoginDate datetime2 8 27 7 0 0 NULL
dbo AspNetUsers 8 IsActive bit 1 1 0 0 0 NULL
dbo AspNetUsers 10 NationalCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 15 TotalSavedMoney decimal 9 18 2 0 0 NULL
dbo AspNetUsers 16 ViewCount int 4 10 0 0 0 NULL
dbo AspNetUsers 17 UserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 18 NormalizedUserName nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 19 Email nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 20 NormalizedEmail nvarchar 512 0 0 1 0 NULL
dbo AspNetUsers 21 EmailConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 22 PasswordHash nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 23 SecurityStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 24 ConcurrencyStamp nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 25 PhoneNumber nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 26 PhoneNumberConfirmed bit 1 1 0 0 0 NULL
dbo AspNetUsers 27 TwoFactorEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 28 LockoutEnd datetimeoffset 10 34 7 1 0 NULL
dbo AspNetUsers 29 LockoutEnabled bit 1 1 0 0 0 NULL
dbo AspNetUsers 30 AccessFailedCount int 4 10 0 0 0 NULL
dbo AspNetUsers 31 RegDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 32 LastLoginDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 33 RegDate2 datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo AspNetUsers 34 Familiar1FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 35 Familiar1LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 36 Familiar1Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 37 Familiar2FirstName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 38 Familiar2LastName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 39 Familiar2Mobile nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 40 FatherName nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 41 CustomerId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUsers 42 AffiliateCode nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 43 CommissionPercent int 4 10 0 0 0 ((0))
dbo AspNetUsers 44 Phone nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 45 MobileVerified bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 46 Otp int 4 10 0 0 0 ((0))
dbo AspNetUsers 47 RegistrationCompleted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 48 Credit decimal 9 18 2 0 0 ((0.0))
dbo AspNetUsers 49 BusinessName nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 50 AgentId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 53 BankAccountsJson nvarchar -1 0 0 1 0 NULL
dbo AspNetUsers 54 CustomerMarketerId bigint 8 19 0 1 0 NULL
dbo AspNetUsers 55 PostalCode nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 56 Shenasname nvarchar 40 0 0 1 0 NULL
dbo AspNetUsers 57 City nvarchar 100 0 0 1 0 NULL
dbo AspNetUsers 58 SmsActiveForMembers bit 1 1 0 0 0 (CONVERT([bit],(1)))
dbo AspNetUsers 59 AgentMetaDataId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUsers 60 WalletIsLock bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AspNetUsers 61 BirthDate datetime2 8 27 7 1 0 NULL
dbo AspNetUsers 62 ReliabilityId uniqueidentifier 16 0 0 1 0 NULL
dbo AspNetUsers 63 UserCode nvarchar 100 0 0 1 0 NULL
dbo AspNetUserTokens 1 UserId bigint 8 19 0 0 0 NULL
dbo AspNetUserTokens 2 LoginProvider nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 3 Name nvarchar 900 0 0 0 0 NULL
dbo AspNetUserTokens 4 Value nvarchar -1 0 0 1 0 NULL
dbo AssuranceChequeItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceChequeItem 2 DueDate datetime2 8 27 7 0 0 NULL
dbo AssuranceChequeItem 3 FileName nvarchar 100 0 0 1 0 NULL
dbo AssuranceChequeItem 4 ChequeNumber nvarchar 40 0 0 1 0 NULL
dbo AssuranceChequeItem 5 SayadiId nvarchar 50 0 0 1 0 NULL
dbo AssuranceChequeItem 6 Price decimal 9 18 2 0 0 NULL
dbo AssuranceChequeItem 7 AssuranceId uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceChequeItem 8 IsCollected bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AssuranceChequeItem 9 IsReturned bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo AssuranceRequirementItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceRequirementItems 2 Title nvarchar 200 0 0 1 0 NULL
dbo AssuranceRequirementItems 3 Order int 4 10 0 0 0 NULL
dbo AssuranceRequirementItems 4 AssuranceRequirementId uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceRequirementItems 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceRequirements 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AssuranceRequirements 2 Title nvarchar 200 0 0 1 0 NULL
dbo AssuranceRequirements 3 Order int 4 10 0 0 0 NULL
dbo AssuranceRequirements 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Assurances 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Assurances 2 Description nvarchar 4000 0 0 1 0 NULL
dbo Assurances 3 FileName nvarchar 100 0 0 1 0 NULL
dbo Assurances 4 FileSize bigint 8 19 0 0 0 NULL
dbo Assurances 5 FileType nvarchar 40 0 0 1 0 NULL
dbo Assurances 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo Assurances 7 AssuranceType int 4 10 0 0 0 ((0))
dbo Assurances 8 GoldWeight decimal 9 18 4 0 0 NULL
dbo Assurances 9 IsReturned bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Assurances 10 OrganizationId uniqueidentifier 16 0 0 1 0 NULL
dbo Assurances 11 PersonFullName nvarchar 100 0 0 1 0 NULL
dbo Assurances 12 PersonNationalCode nvarchar 40 0 0 1 0 NULL
dbo Assurances 13 PersonalCode nvarchar 100 0 0 1 0 NULL
dbo Assurances 14 ReturnDateTime datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo Assurances 15 ReturnedToPerson nvarchar 100 0 0 1 0 NULL
dbo Assurances 16 MobileVerified bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Assurances 17 PersonMobile nvarchar 100 0 0 1 0 NULL
dbo Assurances 18 CoinType int 4 10 0 0 0 ((0))
dbo Assurances 19 ReturnFileName nvarchar 100 0 0 1 0 NULL
dbo Assurances 20 ReturnFileSize bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo Assurances 21 ReturnFileType nvarchar 40 0 0 1 0 NULL
dbo Assurances 22 GuarantorUserId bigint 8 19 0 1 0 NULL
dbo AuthorizationItem 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo AuthorizationItem 2 Title nvarchar 200 0 0 1 0 NULL
dbo AuthorizationItem 3 Description nvarchar -1 0 0 1 0 NULL
dbo AuthorizationItem 4 SystemType int 4 10 0 0 0 NULL
dbo AuthorizationItem 5 UseIfAlreadyExist bit 1 1 0 0 0 NULL
dbo AuthorizationItem 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo BusinessAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo BusinessAuthorizationItems 2 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo BusinessAuthorizationItems 3 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo BusinessAuthorizationItems 4 Cost decimal 9 18 2 0 0 ((0.0))
dbo Consultants 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Consultants 2 Name nvarchar 200 0 0 1 0 NULL
dbo Consultants 3 Phone nvarchar 40 0 0 1 0 NULL
dbo Consultants 4 Description nvarchar 2000 0 0 1 0 NULL
dbo Consultants 5 IsSeen bit 1 1 0 0 0 NULL
dbo Consultants 6 CallResult nvarchar 2000 0 0 1 0 NULL
dbo Consultants 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Contacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Contacts 2 FullName nvarchar 200 0 0 1 0 NULL
dbo Contacts 3 BusinessName nvarchar 200 0 0 1 0 NULL
dbo Contacts 4 Phone nvarchar 100 0 0 1 0 NULL
dbo Contacts 5 Address nvarchar 500 0 0 1 0 NULL
dbo Contacts 6 BankInfo nvarchar -1 0 0 1 0 NULL
dbo Contacts 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerMarketerCommissions 2 Amount decimal 9 18 2 0 0 NULL
dbo CustomerMarketerCommissions 3 Date datetime2 8 27 7 0 0 NULL
dbo CustomerMarketerCommissions 4 Description nvarchar 1000 0 0 1 0 NULL
dbo CustomerMarketerCommissions 5 MarketerId bigint 8 19 0 0 0 NULL
dbo CustomerMarketerCommissions 6 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerOrders 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerOrders 2 Name nvarchar 200 0 0 1 0 NULL
dbo CustomerOrders 3 NationalCode nvarchar 40 0 0 1 0 NULL
dbo CustomerOrders 4 Phone nvarchar 40 0 0 1 0 NULL
dbo CustomerOrders 5 ProductName nvarchar 400 0 0 1 0 NULL
dbo CustomerOrders 6 Description nvarchar 2000 0 0 1 0 NULL
dbo CustomerOrders 7 IsSeen bit 1 1 0 0 0 NULL
dbo CustomerOrders 8 CallResult nvarchar 2000 0 0 1 0 NULL
dbo CustomerOrders 9 SaveDate datetime2 8 27 7 0 0 NULL
dbo CustomerOrders 10 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 2 StartDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 3 EndDate datetime2 8 27 7 0 0 NULL
dbo CustomerPurchasePlan 4 MaxLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 5 RemainLoanCount int 4 10 0 0 0 NULL
dbo CustomerPurchasePlan 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo CustomerPurchasePlan 7 PurchaseId uniqueidentifier 16 0 0 1 0 NULL
dbo Customers 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Customers 2 Name nvarchar -1 0 0 1 0 NULL
dbo Customers 3 Mobile nvarchar -1 0 0 1 0 NULL
dbo Customers 4 Email nvarchar -1 0 0 1 0 NULL
dbo Customers 5 FirstLoginDone bit 1 1 0 0 0 NULL
dbo Customers 6 InitPassword nvarchar -1 0 0 1 0 NULL
dbo Customers 7 RegDate datetime2 8 27 7 0 0 NULL
dbo Customers 8 ExpireDate datetime2 8 27 7 0 0 NULL
dbo Customers 9 Permanent bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 10 Purchased bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Customers 11 Code int 4 10 0 0 1 NULL
dbo Customers 12 AffCode nvarchar 40 0 0 1 0 NULL
dbo Customers 13 ParkDomain nvarchar 200 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo EmzameContractAuthorizationItems 2 UserLoanRequestAuthorizationItemId uniqueidentifier 16 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 3 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 4 UserId bigint 8 19 0 1 0 NULL
dbo EmzameContractAuthorizationItems 5 ContractJson nvarchar -1 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 6 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo EmzameContractAuthorizationItems 7 Comment nvarchar -1 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 8 Tag nvarchar 200 0 0 1 0 NULL
dbo EmzameContractAuthorizationItems 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Expenses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Expenses 2 Amount decimal 9 18 2 0 0 NULL
dbo Expenses 3 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Expenses 4 Title nvarchar -1 0 0 1 0 NULL
dbo Expenses 5 Comment nvarchar -1 0 0 1 0 NULL
dbo Expenses 6 CostDate datetime2 8 27 7 0 0 NULL
dbo Expenses 7 SaveDate datetime2 8 27 7 0 0 NULL
dbo Expenses 8 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo IceReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IceReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IceReport 4 Price decimal 9 18 2 0 0 NULL
dbo IceReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IceReport 6 ReportID nvarchar 100 0 0 1 0 NULL
dbo IceReport 7 Status nvarchar 200 0 0 1 0 NULL
dbo IceReport 8 IceReportJson nvarchar 2000 0 0 1 0 NULL
dbo IceReport 9 Errors nvarchar 400 0 0 1 0 NULL
dbo IceReport 10 MemberId bigint 8 19 0 0 0 NULL
dbo IceReport 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IceReport 12 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IceReport 13 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo InquirySettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo InquirySettings 2 AppInquiryType int 4 10 0 0 0 NULL
dbo InquirySettings 3 ApiIR_PriceFrom decimal 9 18 2 0 0 NULL
dbo InquirySettings 4 ApiIR_PriceTo decimal 9 18 2 0 0 NULL
dbo InquirySettings 5 ApiIR_IsActive bit 1 1 0 0 0 NULL
dbo IranValidityReport 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 2 Date datetime2 8 27 7 0 0 NULL
dbo IranValidityReport 3 Result nvarchar 40 0 0 1 0 NULL
dbo IranValidityReport 4 Price decimal 9 18 2 0 0 NULL
dbo IranValidityReport 5 Url nvarchar 1000 0 0 1 0 NULL
dbo IranValidityReport 6 ReportPdfFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 7 AttachmentFileName nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 8 ReportID nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 9 Status int 4 10 0 0 0 NULL
dbo IranValidityReport 10 IranValidityReportJson nvarchar 2000 0 0 1 0 NULL
dbo IranValidityReport 11 Messages nvarchar 400 0 0 1 0 NULL
dbo IranValidityReport 12 MemberId bigint 8 19 0 0 0 NULL
dbo IranValidityReport 13 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo IranValidityReport 14 GradeNumber int 4 10 0 0 0 ((0))
dbo LoanAssuranceRequirements 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAssuranceRequirements 2 AssuranceRequirementsJson nvarchar -1 0 0 1 0 NULL
dbo LoanAssuranceRequirements 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAssuranceRequirements 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 6 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanAuthorizationItems 8 AuthorizationItemId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo LoanAuthorizationItems 9 IsPrimary bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo LoanContacts 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 2 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanContacts 4 Share decimal 9 18 2 0 0 NULL
dbo LoanContacts 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 2 Title nvarchar 100 0 0 0 0 NULL
dbo LoanRequestStatuses 3 StepCategory int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 4 Changable bit 1 1 0 0 0 NULL
dbo LoanRequestStatuses 5 Order int 4 10 0 0 0 NULL
dbo LoanRequestStatuses 6 SmsPatternId uniqueidentifier 16 0 0 1 0 NULL
dbo LoanRequestStatuses 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanRequestStatuses 8 SystemRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 9 StatusGroup int 4 10 0 0 0 ((0))
dbo LoanRequestStatuses 10 SystemAgentRequestStatus int 4 10 0 1 0 NULL
dbo LoanRequestStatuses 11 AllowNewRequest bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Loans 2 Title nvarchar 200 0 0 1 0 NULL
dbo Loans 3 Code int 4 10 0 0 0 ((0))
dbo Loans 4 DelayPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 5 EarlyPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 6 ProfitPercent float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Loans 7 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Loans 8 IsSponsored bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 10 IsSmsActive bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 11 FileName nvarchar 200 0 0 1 0 NULL
dbo Loans 12 IncludePlan bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 13 PlanHtml nvarchar -1 0 0 1 0 NULL
dbo Loans 14 PlanShortDescription nvarchar 2000 0 0 1 0 NULL
dbo Loans 15 PlanTitle nvarchar 200 0 0 1 0 NULL
dbo Loans 18 MaxAmount decimal 9 18 2 0 0 ((0.0))
dbo Loans 19 MaxMonthGap int 4 10 0 0 0 ((0))
dbo Loans 20 AllowedInstallments nvarchar -1 0 0 1 0 NULL
dbo Loans 21 CostsJson nvarchar -1 0 0 1 0 NULL
dbo Loans 22 Disable bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 23 DisableText nvarchar 200 0 0 1 0 NULL
dbo Loans 24 HasSponsore bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo Loans 25 DefaultSponsoreCheckoutDays int 4 10 0 0 0 ((0))
dbo Loans 26 LoanProfitType int 4 10 0 0 0 ((0))
dbo LoanTags 1 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanTags 2 TagId uniqueidentifier 16 0 0 0 0 NULL
dbo LoanTags 3 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItemAttachments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItemAttachments 2 MemberAuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItemAttachments 3 Attachment nvarchar 200 0 0 1 0 NULL
dbo MemberAuthorizationItemAttachments 4 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo MemberAuthorizationItemAttachments 5 AttachmentByAdmin bit 1 1 0 0 0 NULL
dbo MemberAuthorizationItemAttachments 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItems 2 MemberId bigint 8 19 0 0 0 NULL
dbo MemberAuthorizationItems 3 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo MemberAuthorizationItems 4 CreateDate datetime2 8 27 7 0 0 NULL
dbo MemberAuthorizationItems 5 LastChangeDate datetime2 8 27 7 0 0 NULL
dbo MemberAuthorizationItems 6 LastChangeBy nvarchar 200 0 0 1 0 NULL
dbo MemberAuthorizationItems 7 MemberDescription nvarchar -1 0 0 1 0 NULL
dbo MemberAuthorizationItems 8 AdminDescription nvarchar 2000 0 0 1 0 NULL
dbo MemberAuthorizationItems 9 Tag nvarchar -1 0 0 1 0 NULL
dbo MemberAuthorizationItems 10 Status int 4 10 0 0 0 NULL
dbo MemberAuthorizationItems 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo MemberPurchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo MemberPurchases 2 PaymentStep int 4 10 0 0 0 NULL
dbo MemberPurchases 3 OnlinePaymentGateway int 4 10 0 0 0 NULL
dbo MemberPurchases 4 UserId bigint 8 19 0 0 0 NULL
dbo MemberPurchases 5 UserLoanPaymentId uniqueidentifier 16 0 0 1 0 NULL
dbo MemberPurchases 6 Amount decimal 9 18 2 0 0 NULL
dbo MemberPurchases 7 StartDate datetime2 8 27 7 0 0 NULL
dbo MemberPurchases 8 Description nvarchar 400 0 0 1 0 NULL
dbo MemberPurchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo MemberPurchases 14 SepJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 15 ZarinPalJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 16 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo MemberPurchases 17 MemberPurchaseType int 4 10 0 0 0 ((0))
dbo MemberPurchases 18 NextPayJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 19 Code int 4 10 0 0 1 NULL
dbo MemberPurchases 20 IPGParsianJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 21 CreatorUserId bigint 8 19 0 1 0 NULL
dbo MemberPurchases 22 SadadJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 23 AgentFactorId uniqueidentifier 16 0 0 1 0 NULL
dbo MemberPurchases 24 SepehrJson nvarchar -1 0 0 1 0 NULL
dbo MemberPurchases 25 ZibalJson nvarchar -1 0 0 1 0 NULL
dbo OffDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OffDate 2 Date datetime2 8 27 7 0 0 NULL
dbo OffDate 3 Title nvarchar 200 0 0 1 0 NULL
dbo OffDate 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 2 Amount decimal 9 18 2 0 0 NULL
dbo OnlineMoneyTransfer 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 4 OnlineMoneyTransferStep int 4 10 0 0 0 NULL
dbo OnlineMoneyTransfer 5 From nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 6 To nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 7 OTP nvarchar 20 0 0 1 0 NULL
dbo OnlineMoneyTransfer 8 OTPGenerateDateTime datetime2 8 27 7 0 0 NULL
dbo OnlineMoneyTransfer 9 OurTraceNumber nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 10 Cif nvarchar 100 0 0 1 0 NULL
dbo OnlineMoneyTransfer 11 IsSuccess bit 1 1 0 0 0 NULL
dbo OnlineMoneyTransfer 12 EFardaJson nvarchar -1 0 0 1 0 NULL
dbo OnlineMoneyTransfer 13 TransactionId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 14 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo OnlineMoneyTransfer 15 OnlineMoneyTransferPanelId uniqueidentifier 16 0 0 1 0 NULL
dbo OnlineMoneyTransfer 16 ToName nvarchar -1 0 0 1 0 NULL
dbo OnlineMoneyTransfer 17 Provider int 4 10 0 0 0 ((0))
dbo OnlineMoneyTransfer 18 ShahinJson nvarchar -1 0 0 1 0 NULL
dbo OnlineMoneyTransfer 19 ShahinResultJson nvarchar -1 0 0 1 0 NULL
dbo Organization 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Organization 2 Name nvarchar 100 0 0 1 0 NULL
dbo Organization 3 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Product 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Product 2 Code nvarchar 20 0 0 1 0 NULL
dbo Product 3 Name nvarchar 400 0 0 1 0 NULL
dbo Product 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 2 ProductType int 4 10 0 0 0 NULL
dbo Purchases 3 PaymentStep int 4 10 0 0 0 NULL
dbo Purchases 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Purchases 5 UserId bigint 8 19 0 0 0 NULL
dbo Purchases 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Purchases 7 Amount decimal 9 18 2 0 0 NULL
dbo Purchases 8 StartDate datetime2 8 27 7 0 0 NULL
dbo Purchases 9 Description nvarchar 400 0 0 1 0 NULL
dbo Purchases 10 ZarinPalAuthority nvarchar 100 0 0 1 0 NULL
dbo Purchases 11 ZarinPalRefId nvarchar -1 0 0 1 0 NULL
dbo Purchases 12 ZarinPalStatus int 4 10 0 0 0 NULL
dbo Purchases 13 IsPaymentSuccess bit 1 1 0 0 0 NULL
dbo Purchases 14 AffCode nvarchar 40 0 0 1 0 NULL
dbo Purchases 15 LoanCount int 4 10 0 0 0 ((0))
dbo Reliability 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Reliability 2 Title nvarchar 100 0 0 1 0 NULL
dbo Reliability 3 Color nvarchar 20 0 0 1 0 NULL
dbo Reliability 4 From int 4 10 0 0 0 NULL
dbo Reliability 5 To int 4 10 0 0 0 NULL
dbo Reliability 6 RowType int 4 10 0 0 0 NULL
dbo Reliability 7 IsNewLoanLock bit 1 1 0 0 0 NULL
dbo Reliability 8 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Reliability 9 Count int 4 10 0 0 0 ((0))
dbo SiteContents 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SiteContents 2 Key nvarchar 200 0 0 1 0 NULL
dbo SiteContents 3 Content nvarchar -1 0 0 1 0 NULL
dbo SiteContents 4 IsJson bit 1 1 0 0 0 NULL
dbo SiteContents 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 2 Title nvarchar 400 0 0 1 0 NULL
dbo SmsPatterns 3 Pattern nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 4 IsSystem bit 1 1 0 0 0 NULL
dbo SmsPatterns 5 Status int 4 10 0 0 0 NULL
dbo SmsPatterns 6 RejectReason nvarchar -1 0 0 1 0 NULL
dbo SmsPatterns 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo SmsPatterns 8 IsPatternBase bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo SmsPatterns 9 PatternBaseCode nvarchar 40 0 0 1 0 NULL
dbo SmsPatterns 10 SmsPatternPanel int 4 10 0 0 0 ((0))
dbo SmsPatterns 11 Category int 4 10 0 0 0 ((0))
dbo SmsPatterns 12 IppanelKeysJson nvarchar -1 0 0 1 0 NULL
dbo SubAgentTransactions 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo SubAgentTransactions 2 Amount decimal 9 18 2 0 0 NULL
dbo SubAgentTransactions 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo SubAgentTransactions 4 PaymentMethod int 4 10 0 0 0 NULL
dbo SubAgentTransactions 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo SubAgentTransactions 6 Description nvarchar 1000 0 0 1 0 NULL
dbo SubAgentTransactions 7 SavedBy nvarchar 200 0 0 1 0 NULL
dbo SubAgentTransactions 8 FileName nvarchar 100 0 0 1 0 NULL
dbo SubAgentTransactions 9 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo SubAgentTransactions 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo Tags 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Tags 2 Title nvarchar 200 0 0 1 0 NULL
dbo Tags 3 TagCategory int 4 10 0 0 0 NULL
dbo Tags 4 IsPublic bit 1 1 0 0 0 NULL
dbo Tags 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 2 DefaultThirdParty int 4 10 0 0 0 NULL
dbo ThirdPartySettings 3 LandaSettingsJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartySettings 4 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartySettings 5 DigibileSettingsJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartyTransfer 2 EntityId nvarchar 100 0 0 1 0 NULL
dbo ThirdPartyTransfer 3 EntityType nvarchar 100 0 0 1 0 NULL
dbo ThirdPartyTransfer 4 LandaJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 5 EntityTag nvarchar 500 0 0 1 0 NULL
dbo ThirdPartyTransfer 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPartyTransfer 7 NikanJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPartyTransfer 8 DigibileJson nvarchar -1 0 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 2 Code int 4 10 0 0 1 NULL
dbo ThirdPersonAssuranceAuthorizationItems 3 UserLoanRequestAuthorizationItemId uniqueidentifier 16 0 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 4 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 5 UserId bigint 8 19 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 6 IsSigned bit 1 1 0 0 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 7 LastChangeDate datetime2 8 27 7 0 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 8 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 9 Comment nvarchar -1 0 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 10 Tag nvarchar -1 0 0 1 0 NULL
dbo ThirdPersonAssuranceAuthorizationItems 11 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo TicketResponses 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo TicketResponses 2 CreatedAt datetime2 8 27 7 0 0 NULL
dbo TicketResponses 3 Description nvarchar -1 0 0 1 0 NULL
dbo TicketResponses 4 FileName nvarchar 200 0 0 1 0 NULL
dbo TicketResponses 5 FromAdmin bit 1 1 0 0 0 NULL
dbo TicketResponses 6 IsSeen bit 1 1 0 0 0 NULL
dbo TicketResponses 7 TicketId uniqueidentifier 16 0 0 0 0 NULL
dbo TicketResponses 8 Role int 4 10 0 0 0 NULL
dbo TicketResponses 9 CreatedById bigint 8 19 0 0 0 NULL
dbo TicketResponses 10 CustomerId uniqueidentifier 16 0 0 1 0 NULL
dbo Tickets 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Tickets 2 Code int 4 10 0 0 1 NULL
dbo Tickets 3 CreatedAt datetime2 8 27 7 0 0 NULL
dbo Tickets 4 Title nvarchar 500 0 0 1 0 NULL
dbo Tickets 5 Status int 4 10 0 0 0 NULL
dbo Tickets 6 Role int 4 10 0 0 0 NULL
dbo Tickets 7 ResponseCount int 4 10 0 0 0 NULL
dbo Tickets 8 AsMessage bit 1 1 0 0 0 NULL
dbo Tickets 9 CreatedById bigint 8 19 0 0 0 NULL
dbo Tickets 10 TargetRole int 4 10 0 0 0 NULL
dbo Tickets 11 TargetUserId bigint 8 19 0 1 0 NULL
dbo Tickets 12 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Tickets 13 UserLoanRequestId uniqueidentifier 16 0 0 1 0 NULL
dbo Tickets 14 CustomerId uniqueidentifier 16 0 0 1 0 NULL
dbo Tickets 15 LastModifiedAt datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanContact 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 3 ContactId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 4 Share decimal 9 18 2 0 0 NULL
dbo UserLoanContact 5 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanContact 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanContact 7 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanPaymentOthers 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentOthers 2 UserLoanPaymentId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentOthers 3 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPaymentOthers 4 SavedBy nvarchar 100 0 0 1 0 NULL
dbo UserLoanPaymentOthers 5 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentOthers 6 PaymentMethod int 4 10 0 0 0 NULL
dbo UserLoanPaymentOthers 7 IsGoldCheckouted bit 1 1 0 0 0 NULL
dbo UserLoanPaymentOthers 8 GoldWeight float 8 53 0 0 0 NULL
dbo UserLoanPaymentOthers 9 GoldRate float 8 53 0 0 0 NULL
dbo UserLoanPaymentOthers 10 Description nvarchar 2000 0 0 1 0 NULL
dbo UserLoanPaymentOthers 11 MemberPurchaseId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanPaymentRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 2 UserLoanPaymentId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPaymentRequests 3 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 4 PaymentDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPaymentRequests 6 MemberDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 7 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanPaymentRequests 8 Status int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 9 PaymentMethod int 4 10 0 0 0 NULL
dbo UserLoanPaymentRequests 10 TrackNumber nvarchar 100 0 0 1 0 NULL
dbo UserLoanPaymentRequests 11 AdminAcceptorId bigint 8 19 0 1 0 NULL
dbo UserLoanPaymentRequests 12 AdminAcceptDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPaymentRequests 13 AffectOnMainPayment bit 1 1 0 0 0 NULL
dbo UserLoanPaymentRequests 14 FileName nvarchar 100 0 0 1 0 NULL
dbo UserLoanPayments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanPayments 3 InstallmentNumber int 4 10 0 0 0 NULL
dbo UserLoanPayments 4 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanPayments 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserLoanPayments 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanPayments 9 DelayDay int 4 10 0 0 0 ((0))
dbo UserLoanPayments 10 DelayPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 11 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoanPayments 12 GoldRate float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 13 GoldWeight float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo UserLoanPayments 14 PaymentMethod int 4 10 0 0 0 ((0))
dbo UserLoanPayments 15 IsGoldCheckouted bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 16 Code int 4 10 0 0 1 NULL
dbo UserLoanPayments 17 SentDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 18 InstallmentAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 20 SentBeforeDueDateEmail bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 21 SentBeforeDueDateSms bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 22 SentDueDateEmail bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 23 SentOverDueDateEmail bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanPayments 24 SumAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 25 LastOverDueSmsDate datetime2 8 27 7 1 0 NULL
dbo UserLoanPayments 26 Discount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanPayments 27 LastGuarantorOverDueSmsDate datetime2 8 27 7 1 0 NULL
dbo UserLoanProduct 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanProduct 2 Price decimal 9 18 2 0 0 NULL
dbo UserLoanProduct 3 Count decimal 9 18 2 0 0 NULL
dbo UserLoanProduct 4 ProductId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanProduct 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 2 UserLoanRequestAuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 3 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 4 MemberDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 5 AttachmentByAdmin bit 1 1 0 0 0 NULL
dbo UserLoanRequestAuthorizationItemAttachments 6 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 2 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 3 AuthorizationItemId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 4 CreateDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 5 LastChangeDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestAuthorizationItems 6 Attachment nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 7 MemberDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 8 AdminDescription nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 9 Status int 4 10 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 10 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestAuthorizationItems 11 AttachmentByAdmin bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequestAuthorizationItems 12 Code int 4 10 0 0 1 NULL
dbo UserLoanRequestAuthorizationItems 13 Tag nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequestAuthorizationItems 15 EmzameContractAuthorizationItemId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestProduct 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestProduct 2 Price decimal 9 18 2 0 0 NULL
dbo UserLoanRequestProduct 3 Count decimal 9 18 2 0 0 NULL
dbo UserLoanRequestProduct 4 ProductId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestProduct 5 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequests 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequests 4 RequestDate datetime2 8 27 7 0 0 NULL
dbo UserLoanRequests 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanRequests 6 Comment nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 7 AdminDescriptionPrivate nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 9 Month int 4 10 0 0 0 NULL
dbo UserLoanRequests 10 Year int 4 10 0 0 0 NULL
dbo UserLoanRequests 11 CustomerId uniqueidentifier 16 0 0 0 0 ('00000000-0000-0000-0000-000000000000')
dbo UserLoanRequests 12 InstallmentCount int 4 10 0 0 0 ((0))
dbo UserLoanRequests 13 MonthGap int 4 10 0 0 0 ((0))
dbo UserLoanRequests 14 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoanRequests 15 Code int 4 10 0 0 1 NULL
dbo UserLoanRequests 16 Installment decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 18 IsPhysicalDocsDelivered bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoanRequests 19 AdminDescription nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequests 20 SponsoreDueDate datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoanRequests 21 StatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 22 AgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequests 23 ChargeType int 4 10 0 0 0 ((0))
dbo UserLoanRequests 24 SponsoreAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 25 LockedBy nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequests 26 RefahBetaInquiryAmount bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo UserLoanRequests 27 RefahBetaOrderId bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo UserLoanRequests 28 OtherPercent_CheckoutDays int 4 10 0 0 0 ((0))
dbo UserLoanRequests 29 OtherPercent_Percent decimal 9 18 2 0 0 ((0.0))
dbo UserLoanRequests 30 Products nvarchar -1 0 0 1 0 NULL
dbo UserLoanRequests 31 LastSponsorComment nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequests 32 SponsorId bigint 8 19 0 1 0 NULL
dbo UserLoanRequests 33 UserLoanSponsorStatus int 4 10 0 0 0 ((0))
dbo UserLoanRequests 34 ChargeTypeTitle nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestSponsorHistory 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestSponsorHistory 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequestSponsorHistory 3 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestSponsorHistory 4 DateTime datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestSponsorHistory 5 Subject nvarchar 200 0 0 1 0 NULL
dbo UserLoanRequestSponsorHistory 6 Description nvarchar 2000 0 0 1 0 NULL
dbo UserLoanRequestSponsorHistory 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoanRequestStatusHistories 3 UserLoanRequestId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanRequestStatusHistories 4 DateTime datetime2 8 27 7 0 0 NULL
dbo UserLoanRequestStatusHistories 5 FromStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 6 FromAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 7 ToStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 8 ToAgentStatusId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoanRequestStatusHistories 9 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 2 UserId bigint 8 19 0 0 0 NULL
dbo UserLoans 3 LoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoans 4 StartDate datetime2 8 27 7 0 0 NULL
dbo UserLoans 5 Amount decimal 9 18 2 0 0 NULL
dbo UserLoans 6 Installment decimal 9 18 2 0 0 NULL
dbo UserLoans 7 Month int 4 10 0 0 0 NULL
dbo UserLoans 8 Paid decimal 9 18 2 0 0 NULL
dbo UserLoans 9 Remain decimal 9 18 2 0 0 NULL
dbo UserLoans 10 CheckoutDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 11 IsCheckouted bit 1 1 0 1 0 NULL
dbo UserLoans 12 Code int 4 10 0 0 1 NULL
dbo UserLoans 13 Description nvarchar -1 0 0 1 0 NULL
dbo UserLoans 14 MonthGap int 4 10 0 0 0 ((1))
dbo UserLoans 15 PayableAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 16 CustomerPurchasePlanId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 17 AgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 18 UserLoanRequestId uniqueidentifier 16 0 0 1 0 NULL
dbo UserLoans 19 AgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 20 AgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 21 SubAgentDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 22 SubAgentId bigint 8 19 0 1 0 NULL
dbo UserLoans 23 SubAgentPrice decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 24 DepositChargeDueDate datetime2 8 27 7 1 0 NULL
dbo UserLoans 25 PreDepositAmount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 26 Status nvarchar 100 0 0 1 0 NULL
dbo UserLoans 27 CustomProfitPercent decimal 9 18 2 1 0 NULL
dbo UserLoans 28 CreateAt datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo UserLoans 29 RefahBetaInquiryAmount bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo UserLoans 30 RefahBetaOrderId bigint 8 19 0 0 0 (CONVERT([bigint],(0)))
dbo UserLoans 31 Discount decimal 9 18 2 0 0 ((0.0))
dbo UserLoans 32 IsCanceled bit 1 1 0 0 0 (CONVERT([bit],(0)))
dbo UserLoans 33 SecondaryCode nvarchar 100 0 0 1 0 NULL
dbo UserLoanSponsoreDueDate 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 2 UserLoanId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 3 Amount decimal 9 18 2 0 0 NULL
dbo UserLoanSponsoreDueDate 4 DueDate datetime2 8 27 7 0 0 NULL
dbo UserLoanSponsoreDueDate 5 Description nvarchar 1000 0 0 1 0 NULL
dbo UserLoanSponsoreDueDate 6 IsCheckouted bit 1 1 0 0 0 NULL
dbo UserLoanSponsoreDueDate 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserLoanSponsoreDueDate 8 UserLoanId1 uniqueidentifier 16 0 0 1 0 NULL
dbo UserRefahBeta 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserRefahBeta 2 ModifiedAt datetime2 8 27 7 0 0 NULL
dbo UserRefahBeta 3 Message nvarchar 500 0 0 1 0 NULL
dbo UserRefahBeta 4 Amount bigint 8 19 0 0 0 NULL
dbo UserRefahBeta 5 IsSuccess bit 1 1 0 0 0 NULL
dbo UserRefahBeta 6 UserId bigint 8 19 0 0 0 NULL
dbo UserRefahBeta 7 CustomerId uniqueidentifier 16 0 0 0 0 NULL
dbo UserSavedMonies 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo UserSavedMonies 2 MemberId bigint 8 19 0 0 0 NULL
dbo UserSavedMonies 3 Description nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 4 Amount decimal 9 18 2 0 0 NULL
dbo UserSavedMonies 5 SavedBy nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 6 SaveDate datetime2 8 27 7 0 0 NULL
dbo UserSavedMonies 7 FileMonth nvarchar -1 0 0 1 0 NULL
dbo UserSavedMonies 8 TargetMonth datetime2 8 27 7 0 0 ('0001-01-01T00:00:00.0000000')
dbo VisitorLogs 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo VisitorLogs 2 Date datetime2 8 27 7 0 0 NULL
dbo VisitorLogs 3 IpAddress nvarchar 100 0 0 1 0 NULL
dbo VisitorLogs 4 UserAgent nvarchar 400 0 0 1 0 NULL
dbo VisitorLogs 5 Mrk nvarchar -1 0 0 1 0 NULL
dbo WithdrawAgentFactor 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo WithdrawAgentFactor 2 WithdrawId uniqueidentifier 16 0 0 0 0 NULL
dbo WithdrawAgentFactor 3 AgentFactorId uniqueidentifier 16 0 0 0 0 NULL
dbo Withdraws 1 Id uniqueidentifier 16 0 0 0 0 NULL
dbo Withdraws 2 Amount decimal 9 18 2 0 0 NULL
dbo Withdraws 3 SaveDate datetime2 8 27 7 0 0 NULL
dbo Withdraws 4 PaymentMethod int 4 10 0 0 0 NULL
dbo Withdraws 5 IsWithdraw bit 1 1 0 0 0 NULL
dbo Withdraws 6 IsUnknown bit 1 1 0 0 0 NULL
dbo Withdraws 7 GoldWeight float 8 53 0 0 0 NULL
dbo Withdraws 8 GoldRate float 8 53 0 0 0 NULL
dbo Withdraws 9 Description nvarchar -1 0 0 1 0 NULL
dbo Withdraws 10 SavedBy nvarchar -1 0 0 1 0 NULL
dbo Withdraws 11 WeightBalance float 8 53 0 0 0 ((0.0000000000000000e+000))
dbo Withdraws 12 CustomerId uniqueidentifier 16 0 0 0 0 ('2a18f1fc-57fe-482c-8003-b6ba13b12996')
dbo Withdraws 13 SponsoredLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 14 AgentId bigint 8 19 0 1 0 NULL
dbo Withdraws 15 UserLoanId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 16 ContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 17 UserLoanContactId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 18 FileName nvarchar 100 0 0 1 0 NULL
dbo Withdraws 19 SuccessfullOnlineMoneyTransferId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 20 CustomerMarketerCommissionId uniqueidentifier 16 0 0 1 0 NULL
dbo Withdraws 21 FileName2 nvarchar 100 0 0 1 0 NULL
dbo Withdraws 22 FileName3 nvarchar 100 0 0 1 0 NULL
HangFire AggregatedCounter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire AggregatedCounter 3 Value bigint 8 19 0 0 0 NULL
HangFire AggregatedCounter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Counter 3 Value int 4 10 0 0 0 NULL
HangFire Counter 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Counter 5 Id bigint 8 19 0 0 1 NULL
HangFire Hash 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Hash 3 Field nvarchar 200 0 0 0 0 NULL
HangFire Hash 4 Value nvarchar -1 0 0 1 0 NULL
HangFire Hash 5 ExpireAt datetime2 8 27 7 1 0 NULL
HangFire Job 1 Id bigint 8 19 0 0 1 NULL
HangFire Job 2 StateId bigint 8 19 0 1 0 NULL
HangFire Job 3 StateName nvarchar 40 0 0 1 0 NULL
HangFire Job 4 InvocationData nvarchar -1 0 0 0 0 NULL
HangFire Job 5 Arguments nvarchar -1 0 0 0 0 NULL
HangFire Job 6 CreatedAt datetime 8 23 3 0 0 NULL
HangFire Job 7 ExpireAt datetime 8 23 3 1 0 NULL
HangFire JobParameter 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobParameter 3 Name nvarchar 80 0 0 0 0 NULL
HangFire JobParameter 4 Value nvarchar -1 0 0 1 0 NULL
HangFire JobQueue 1 Id bigint 8 19 0 0 1 NULL
HangFire JobQueue 2 JobId bigint 8 19 0 0 0 NULL
HangFire JobQueue 3 Queue nvarchar 100 0 0 0 0 NULL
HangFire JobQueue 4 FetchedAt datetime 8 23 3 1 0 NULL
HangFire List 1 Id bigint 8 19 0 0 1 NULL
HangFire List 2 Key nvarchar 200 0 0 0 0 NULL
HangFire List 3 Value nvarchar -1 0 0 1 0 NULL
HangFire List 4 ExpireAt datetime 8 23 3 1 0 NULL
HangFire Schema 1 Version int 4 10 0 0 0 NULL
HangFire Server 1 Id nvarchar 400 0 0 0 0 NULL
HangFire Server 2 Data nvarchar -1 0 0 1 0 NULL
HangFire Server 3 LastHeartbeat datetime 8 23 3 0 0 NULL
HangFire Set 2 Key nvarchar 200 0 0 0 0 NULL
HangFire Set 3 Score float 8 53 0 0 0 NULL
HangFire Set 4 Value nvarchar 512 0 0 0 0 NULL
HangFire Set 5 ExpireAt datetime 8 23 3 1 0 NULL
HangFire State 1 Id bigint 8 19 0 0 1 NULL
HangFire State 2 JobId bigint 8 19 0 0 0 NULL
HangFire State 3 Name nvarchar 40 0 0 0 0 NULL
HangFire State 4 Reason nvarchar 200 0 0 1 0 NULL
HangFire State 5 CreatedAt datetime 8 23 3 0 0 NULL
HangFire State 6 Data nvarchar -1 0 0 1 0 NULL
```

### PRIMARY AND UNIQUE KEYS

```text
schema_name table_name index_name is_primary_key is_unique key_ordinal column_name
----------- ---------- ---------- -------------- --------- ----------- -----------
dbo __EFMigrationsHistory PK___EFMigrationsHistory 1 1 1 MigrationId
dbo AffiliateCommissions PK_AffiliateCommissions 1 1 1 Id
dbo AgentFactorItem PK_AgentFactorItem 1 1 1 Id
dbo AgentFactors PK_AgentFactors 1 1 1 Id
dbo AgentLoanAuthorizationItem PK_AgentLoanAuthorizationItem 1 1 1 Id
dbo AgentLoans PK_AgentLoans 1 1 1 Id
dbo AgentMetaData IX_AgentMetaData_UserId 0 1 1 UserId
dbo AgentMetaData PK_AgentMetaData 1 1 1 Id
dbo AppEmails PK_AppEmails 1 1 1 Id
dbo AppInquirys PK_AppInquirys 1 1 1 Id
dbo AppSettings PK_AppSettings 1 1 1 Id
dbo AppSms PK_AppSms 1 1 1 Id
dbo AspNetRoleClaims PK_AspNetRoleClaims 1 1 1 Id
dbo AspNetRoles PK_AspNetRoles 1 1 1 Id
dbo AspNetRoles RoleNameIndex 0 1 1 NormalizedName
dbo AspNetUserClaims PK_AspNetUserClaims 1 1 1 Id
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 1 LoginProvider
dbo AspNetUserLogins PK_AspNetUserLogins 1 1 2 ProviderKey
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 1 UserId
dbo AspNetUserRoles PK_AspNetUserRoles 1 1 2 RoleId
dbo AspNetUsers PK_AspNetUsers 1 1 1 Id
dbo AspNetUsers UserNameIndex 0 1 1 NormalizedUserName
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 1 UserId
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 2 LoginProvider
dbo AspNetUserTokens PK_AspNetUserTokens 1 1 3 Name
dbo AssuranceChequeItem PK_AssuranceChequeItem 1 1 1 Id
dbo AssuranceRequirementItems PK_AssuranceRequirementItems 1 1 1 Id
dbo AssuranceRequirements PK_AssuranceRequirements 1 1 1 Id
dbo Assurances PK_Assurances 1 1 1 Id
dbo AuthorizationItem PK_AuthorizationItem 1 1 1 Id
dbo BusinessAuthorizationItems PK_BusinessAuthorizationItems 1 1 1 Id
dbo Consultants PK_Consultants 1 1 1 Id
dbo Contacts PK_Contacts 1 1 1 Id
dbo CustomerMarketerCommissions PK_CustomerMarketerCommissions 1 1 1 Id
dbo CustomerOrders PK_CustomerOrders 1 1 1 Id
dbo CustomerPurchasePlan PK_CustomerPurchasePlan 1 1 1 Id
dbo Customers PK_Customers 1 1 1 Id
dbo EmzameContractAuthorizationItems IX_EmzameContractAuthorizationItems_UserLoanRequestAuthorizationItemId 0 1 1 UserLoanRequestAuthorizationItemId
dbo EmzameContractAuthorizationItems PK_EmzameContractAuthorizationItems 1 1 1 Id
dbo Expenses PK_Expenses 1 1 1 Id
dbo IceReport PK_IceReport 1 1 1 Id
dbo InquirySettings PK_InquirySettings 1 1 1 Id
dbo IranValidityReport PK_IranValidityReport 1 1 1 Id
dbo LoanAssuranceRequirements PK_LoanAssuranceRequirements 1 1 1 Id
dbo LoanAuthorizationItems PK_LoanAuthorizationItems 1 1 1 Id
dbo LoanContacts PK_LoanContacts 1 1 1 Id
dbo LoanRequestStatuses PK_LoanRequestStatuses 1 1 1 Id
dbo Loans PK_Loans 1 1 1 Id
dbo LoanTags PK_LoanTags 1 1 1 LoanId
dbo LoanTags PK_LoanTags 1 1 2 TagId
dbo MemberAuthorizationItemAttachments PK_MemberAuthorizationItemAttachments 1 1 1 Id
dbo MemberAuthorizationItems PK_MemberAuthorizationItems 1 1 1 Id
dbo MemberPurchases PK_MemberPurchases 1 1 1 Id
dbo OffDate PK_OffDate 1 1 1 Id
dbo OnlineMoneyTransfer PK_OnlineMoneyTransfer 1 1 1 Id
dbo Organization PK_Organization 1 1 1 Id
dbo Product PK_Product 1 1 1 Id
dbo Purchases PK_Purchases 1 1 1 Id
dbo Reliability PK_Reliability 1 1 1 Id
dbo SiteContents PK_SiteContents 1 1 1 Id
dbo SmsPatterns PK_SmsPatterns 1 1 1 Id
dbo SubAgentTransactions PK_SubAgentTransactions 1 1 1 Id
dbo Tags PK_Tags 1 1 1 Id
dbo ThirdPartySettings PK_ThirdPartySettings 1 1 1 Id
dbo ThirdPartyTransfer PK_ThirdPartyTransfer 1 1 1 Id
dbo ThirdPersonAssuranceAuthorizationItems PK_ThirdPersonAssuranceAuthorizationItems 1 1 1 Id
dbo TicketResponses PK_TicketResponses 1 1 1 Id
dbo Tickets PK_Tickets 1 1 1 Id
dbo UserLoanContact PK_UserLoanContact 1 1 1 Id
dbo UserLoanPaymentOthers PK_UserLoanPaymentOthers 1 1 1 Id
dbo UserLoanPaymentRequests PK_UserLoanPaymentRequests 1 1 1 Id
dbo UserLoanPayments PK_UserLoanPayments 1 1 1 Id
dbo UserLoanProduct PK_UserLoanProduct 1 1 1 Id
dbo UserLoanRequestAuthorizationItemAttachments PK_UserLoanRequestAuthorizationItemAttachments 1 1 1 Id
dbo UserLoanRequestAuthorizationItems PK_UserLoanRequestAuthorizationItems 1 1 1 Id
dbo UserLoanRequestProduct PK_UserLoanRequestProduct 1 1 1 Id
dbo UserLoanRequests PK_UserLoanRequests 1 1 1 Id
dbo UserLoanRequestSponsorHistory PK_UserLoanRequestSponsorHistory 1 1 1 Id
dbo UserLoanRequestStatusHistories PK_UserLoanRequestStatusHistories 1 1 1 Id
dbo UserLoans PK_UserLoans 1 1 1 Id
dbo UserLoanSponsoreDueDate PK_UserLoanSponsoreDueDate 1 1 1 Id
dbo UserRefahBeta PK_UserRefahBeta 1 1 1 Id
dbo UserSavedMonies PK_UserSavedMonies 1 1 1 Id
dbo VisitorLogs PK_VisitorLogs 1 1 1 Id
dbo WithdrawAgentFactor PK_WithdrawAgentFactor 1 1 1 Id
dbo Withdraws PK_Withdraws 1 1 1 Id
HangFire AggregatedCounter PK_HangFire_CounterAggregated 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 1 Key
HangFire Counter PK_HangFire_Counter 1 1 2 Id
HangFire Hash PK_HangFire_Hash 1 1 1 Key
HangFire Hash PK_HangFire_Hash 1 1 2 Field
HangFire Job PK_HangFire_Job 1 1 1 Id
HangFire JobParameter PK_HangFire_JobParameter 1 1 1 JobId
HangFire JobParameter PK_HangFire_JobParameter 1 1 2 Name
HangFire JobQueue PK_HangFire_JobQueue 1 1 1 Queue
HangFire JobQueue PK_HangFire_JobQueue 1 1 2 Id
HangFire List PK_HangFire_List 1 1 1 Key
HangFire List PK_HangFire_List 1 1 2 Id
HangFire Schema PK_HangFire_Schema 1 1 1 Version
HangFire Server PK_HangFire_Server 1 1 1 Id
HangFire Set PK_HangFire_Set 1 1 1 Key
HangFire Set PK_HangFire_Set 1 1 2 Value
HangFire State PK_HangFire_State 1 1 1 JobId
HangFire State PK_HangFire_State 1 1 2 Id
```

### FOREIGN KEYS

```text
source_table source_column target_table target_column constraint_name delete_referential_action_desc update_referential_action_desc is_disabled
------------ ------------- ------------ ------------- --------------- ------------------------------ ------------------------------ -----------
dbo.AffiliateCommissions UserId dbo.AspNetUsers Id FK_AffiliateCommissions_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AffiliateCommissions PurchaseId dbo.Purchases Id FK_AffiliateCommissions_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.AgentFactorItem AgentFactorId dbo.AgentFactors Id FK_AgentFactorItem_AgentFactors_AgentFactorId NO_ACTION NO_ACTION 0
dbo.AgentFactorItem CustomerId dbo.Customers Id FK_AgentFactorItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AgentFactors AgentId dbo.AspNetUsers Id FK_AgentFactors_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.AgentFactors MemberId dbo.AspNetUsers Id FK_AgentFactors_AspNetUsers_MemberId CASCADE NO_ACTION 0
dbo.AgentFactors CustomerId dbo.Customers Id FK_AgentFactors_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AgentFactors MemberPurchaseId dbo.MemberPurchases Id FK_AgentFactors_MemberPurchases_MemberPurchaseId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem AuthorizationItemId dbo.AuthorizationItem Id FK_AgentLoanAuthorizationItem_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem CustomerId dbo.Customers Id FK_AgentLoanAuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AgentLoanAuthorizationItem LoanId dbo.Loans Id FK_AgentLoanAuthorizationItem_Loans_LoanId CASCADE NO_ACTION 0
dbo.AgentLoans AgentId dbo.AspNetUsers Id FK_AgentLoans_AspNetUsers_AgentId CASCADE NO_ACTION 0
dbo.AgentLoans ContactId dbo.Contacts Id FK_AgentLoans_Contacts_ContactId CASCADE NO_ACTION 0
dbo.AgentLoans CustomerId dbo.Customers Id FK_AgentLoans_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AgentLoans LoanId dbo.Loans Id FK_AgentLoans_Loans_LoanId CASCADE NO_ACTION 0
dbo.AgentMetaData UserId dbo.AspNetUsers Id FK_AgentMetaData_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AgentMetaData CustomerId dbo.Customers Id FK_AgentMetaData_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AppEmails CustomerId dbo.Customers Id FK_AppEmails_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AppInquirys MemberId dbo.AspNetUsers Id FK_AppInquirys_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.AppInquirys CustomerId dbo.Customers Id FK_AppInquirys_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AppSettings CustomerId dbo.Customers Id FK_AppSettings_Customers_CustomerId CASCADE NO_ACTION 0
dbo.AppSettings AgentFactorPaymentLinkSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_AgentFactorPaymentLinkSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings BeforeDueDateEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_BeforeDueDateEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings BeforeDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_BeforeDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DigitalSignCompleteSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DigitalSignCompleteSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DigitalSignLinkSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DigitalSignLinkSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DigitalSignOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DigitalSignOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DueDateRememberEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DueDateRememberEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings DueDateRememberSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_DueDateRememberSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings GuarantorOverDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_GuarantorOverDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings LoginEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_LoginEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings LoginSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_LoginSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings NewLoanRequestNotificationSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_NewLoanRequestNotificationSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings NewOrderEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_NewOrderEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings NewOrderSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_NewOrderSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings NewUserLoanSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_NewUserLoanSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings OverDueDateEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_OverDueDateEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings OverDueDateSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_OverDueDateSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterOtpEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterOtpEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings RegisterSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_RegisterSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThanksPaymentEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThanksPaymentEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThanksPaymentSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThanksPaymentSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThirdPersonDigitalSignCompleteSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThirdPersonDigitalSignCompleteSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThirdPersonDigitalSignLinkSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThirdPersonDigitalSignLinkSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings ThirdPersonDigitalSignOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_ThirdPersonDigitalSignOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletChargeEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletChargeEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletChargeSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletChargeSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletWithdrawNotificationSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletWithdrawNotificationSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletWithdrawOtpEmailPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletWithdrawOtpEmailPatternId NO_ACTION NO_ACTION 0
dbo.AppSettings WalletWithdrawOtpSmsPatternId dbo.SmsPatterns Id FK_AppSettings_SmsPatterns_WalletWithdrawOtpSmsPatternId NO_ACTION NO_ACTION 0
dbo.AppSms CustomerId dbo.Customers Id FK_AppSms_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetRoleClaims RoleId dbo.AspNetRoles Id FK_AspNetRoleClaims_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserClaims UserId dbo.AspNetUsers Id FK_AspNetUserClaims_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserLogins UserId dbo.AspNetUsers Id FK_AspNetUserLogins_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUserRoles RoleId dbo.AspNetRoles Id FK_AspNetUserRoles_AspNetRoles_RoleId CASCADE NO_ACTION 0
dbo.AspNetUserRoles UserId dbo.AspNetUsers Id FK_AspNetUserRoles_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AspNetUsers AgentId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerMarketerId dbo.AspNetUsers Id FK_AspNetUsers_AspNetUsers_CustomerMarketerId NO_ACTION NO_ACTION 0
dbo.AspNetUsers CustomerId dbo.Customers Id FK_AspNetUsers_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AspNetUsers ReliabilityId dbo.Reliability Id FK_AspNetUsers_Reliability_ReliabilityId NO_ACTION NO_ACTION 0
dbo.AspNetUserTokens UserId dbo.AspNetUsers Id FK_AspNetUserTokens_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.AssuranceChequeItem AssuranceId dbo.Assurances Id FK_AssuranceChequeItem_Assurances_AssuranceId CASCADE NO_ACTION 0
dbo.AssuranceRequirementItems AssuranceRequirementId dbo.AssuranceRequirements Id FK_AssuranceRequirementItems_AssuranceRequirements_AssuranceRequirementId CASCADE NO_ACTION 0
dbo.AssuranceRequirementItems CustomerId dbo.Customers Id FK_AssuranceRequirementItems_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.AssuranceRequirements CustomerId dbo.Customers Id FK_AssuranceRequirements_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Assurances GuarantorUserId dbo.AspNetUsers Id FK_Assurances_AspNetUsers_GuarantorUserId NO_ACTION NO_ACTION 0
dbo.Assurances OrganizationId dbo.Organization Id FK_Assurances_Organization_OrganizationId NO_ACTION NO_ACTION 0
dbo.Assurances UserLoanId dbo.UserLoans Id FK_Assurances_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.AuthorizationItem CustomerId dbo.Customers Id FK_AuthorizationItem_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.BusinessAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_BusinessAuthorizationItems_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.BusinessAuthorizationItems CustomerId dbo.Customers Id FK_BusinessAuthorizationItems_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Contacts CustomerId dbo.Customers Id FK_Contacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.CustomerMarketerCommissions MarketerId dbo.AspNetUsers Id FK_CustomerMarketerCommissions_AspNetUsers_MarketerId CASCADE NO_ACTION 0
dbo.CustomerMarketerCommissions UserLoanId dbo.UserLoans Id FK_CustomerMarketerCommissions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.CustomerOrders CustomerId dbo.Customers Id FK_CustomerOrders_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.CustomerPurchasePlan CustomerId dbo.Customers Id FK_CustomerPurchasePlan_Customers_CustomerId CASCADE NO_ACTION 0
dbo.CustomerPurchasePlan PurchaseId dbo.Purchases Id FK_CustomerPurchasePlan_Purchases_PurchaseId NO_ACTION NO_ACTION 0
dbo.EmzameContractAuthorizationItems UserId dbo.AspNetUsers Id FK_EmzameContractAuthorizationItems_AspNetUsers_UserId NO_ACTION NO_ACTION 0
dbo.EmzameContractAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_EmzameContractAuthorizationItems_AuthorizationItem_AuthorizationItemId CASCADE NO_ACTION 0
dbo.EmzameContractAuthorizationItems UserLoanRequestAuthorizationItemId dbo.UserLoanRequestAuthorizationItems Id FK_EmzameContractAuthorizationItems_UserLoanRequestAuthorizationItems_UserLoanRequestAuthorizationItemId NO_ACTION NO_ACTION 0
dbo.EmzameContractAuthorizationItems UserLoanId dbo.UserLoans Id FK_EmzameContractAuthorizationItems_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.Expenses CustomerId dbo.Customers Id FK_Expenses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.IceReport MemberId dbo.AspNetUsers Id FK_IceReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IceReport CustomerId dbo.Customers Id FK_IceReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.IranValidityReport MemberId dbo.AspNetUsers Id FK_IranValidityReport_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.IranValidityReport CustomerId dbo.Customers Id FK_IranValidityReport_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAssuranceRequirements CustomerId dbo.Customers Id FK_LoanAssuranceRequirements_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAssuranceRequirements LoanId dbo.Loans Id FK_LoanAssuranceRequirements_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_LoanAuthorizationItems_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems CustomerId dbo.Customers Id FK_LoanAuthorizationItems_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanAuthorizationItems LoanId dbo.Loans Id FK_LoanAuthorizationItems_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanContacts ContactId dbo.Contacts Id FK_LoanContacts_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.LoanContacts CustomerId dbo.Customers Id FK_LoanContacts_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanContacts LoanId dbo.Loans Id FK_LoanContacts_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses CustomerId dbo.Customers Id FK_LoanRequestStatuses_Customers_CustomerId CASCADE NO_ACTION 0
dbo.LoanRequestStatuses SmsPatternId dbo.SmsPatterns Id FK_LoanRequestStatuses_SmsPatterns_SmsPatternId NO_ACTION NO_ACTION 0
dbo.Loans CustomerId dbo.Customers Id FK_Loans_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.LoanTags LoanId dbo.Loans Id FK_LoanTags_Loans_LoanId CASCADE NO_ACTION 0
dbo.LoanTags TagId dbo.Tags Id FK_LoanTags_Tags_TagId CASCADE NO_ACTION 0
dbo.MemberAuthorizationItemAttachments MemberAuthorizationItemId dbo.MemberAuthorizationItems Id FK_MemberAuthorizationItemAttachments_MemberAuthorizationItems_MemberAuthorizationItemId CASCADE NO_ACTION 0
dbo.MemberAuthorizationItems MemberId dbo.AspNetUsers Id FK_MemberAuthorizationItems_AspNetUsers_MemberId NO_ACTION NO_ACTION 0
dbo.MemberAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_MemberAuthorizationItems_AuthorizationItem_AuthorizationItemId CASCADE NO_ACTION 0
dbo.MemberPurchases AgentFactorId dbo.AgentFactors Id FK_MemberPurchases_AgentFactors_AgentFactorId NO_ACTION NO_ACTION 0
dbo.MemberPurchases CreatorUserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_CreatorUserId NO_ACTION NO_ACTION 0
dbo.MemberPurchases UserId dbo.AspNetUsers Id FK_MemberPurchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.MemberPurchases UserLoanPaymentId dbo.UserLoanPayments Id FK_MemberPurchases_UserLoanPayments_UserLoanPaymentId NO_ACTION NO_ACTION 0
dbo.OffDate CustomerId dbo.Customers Id FK_OffDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer CustomerId dbo.Customers Id FK_OnlineMoneyTransfer_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.OnlineMoneyTransfer TransactionId dbo.Withdraws Id FK_OnlineMoneyTransfer_Withdraws_TransactionId NO_ACTION NO_ACTION 0
dbo.Organization CustomerId dbo.Customers Id FK_Organization_Customers_CustomerId CASCADE NO_ACTION 0
dbo.Product CustomerId dbo.Customers Id FK_Product_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Purchases UserId dbo.AspNetUsers Id FK_Purchases_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.Purchases CustomerId dbo.Customers Id FK_Purchases_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Reliability CustomerId dbo.Customers Id FK_Reliability_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SiteContents CustomerId dbo.Customers Id FK_SiteContents_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SmsPatterns CustomerId dbo.Customers Id FK_SmsPatterns_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions CustomerId dbo.Customers Id FK_SubAgentTransactions_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.SubAgentTransactions UserLoanId dbo.UserLoans Id FK_SubAgentTransactions_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.Tags CustomerId dbo.Customers Id FK_Tags_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.ThirdPartySettings CustomerId dbo.Customers Id FK_ThirdPartySettings_Customers_CustomerId CASCADE NO_ACTION 0
dbo.ThirdPartyTransfer CustomerId dbo.Customers Id FK_ThirdPartyTransfer_Customers_CustomerId CASCADE NO_ACTION 0
dbo.ThirdPersonAssuranceAuthorizationItems UserId dbo.AspNetUsers Id FK_ThirdPersonAssuranceAuthorizationItems_AspNetUsers_UserId NO_ACTION NO_ACTION 0
dbo.ThirdPersonAssuranceAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_ThirdPersonAssuranceAuthorizationItems_AuthorizationItem_AuthorizationItemId NO_ACTION NO_ACTION 0
dbo.ThirdPersonAssuranceAuthorizationItems UserLoanRequestAuthorizationItemId dbo.UserLoanRequestAuthorizationItems Id FK_ThirdPersonAssuranceAuthorizationItems_UserLoanRequestAuthorizationItems_UserLoanRequestAuthorizationItemId CASCADE NO_ACTION 0
dbo.ThirdPersonAssuranceAuthorizationItems UserLoanId dbo.UserLoans Id FK_ThirdPersonAssuranceAuthorizationItems_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.TicketResponses CreatedById dbo.AspNetUsers Id FK_TicketResponses_AspNetUsers_CreatedById NO_ACTION NO_ACTION 0
dbo.TicketResponses CustomerId dbo.Customers Id FK_TicketResponses_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.TicketResponses TicketId dbo.Tickets Id FK_TicketResponses_Tickets_TicketId CASCADE NO_ACTION 0
dbo.Tickets CreatedById dbo.AspNetUsers Id FK_Tickets_AspNetUsers_CreatedById NO_ACTION NO_ACTION 0
dbo.Tickets TargetUserId dbo.AspNetUsers Id FK_Tickets_AspNetUsers_TargetUserId NO_ACTION NO_ACTION 0
dbo.Tickets CustomerId dbo.Customers Id FK_Tickets_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Tickets UserLoanRequestId dbo.UserLoanRequests Id FK_Tickets_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.Tickets UserLoanId dbo.UserLoans Id FK_Tickets_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.UserLoanContact ContactId dbo.Contacts Id FK_UserLoanContact_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.UserLoanContact CustomerId dbo.Customers Id FK_UserLoanContact_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanContact UserLoanId dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanContact UserLoanId1 dbo.UserLoans Id FK_UserLoanContact_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentOthers MemberPurchaseId dbo.MemberPurchases Id FK_UserLoanPaymentOthers_MemberPurchases_MemberPurchaseId NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentOthers UserLoanPaymentId dbo.UserLoanPayments Id FK_UserLoanPaymentOthers_UserLoanPayments_UserLoanPaymentId CASCADE NO_ACTION 0
dbo.UserLoanPaymentRequests AdminAcceptorId dbo.AspNetUsers Id FK_UserLoanPaymentRequests_AspNetUsers_AdminAcceptorId NO_ACTION NO_ACTION 0
dbo.UserLoanPaymentRequests UserLoanPaymentId dbo.UserLoanPayments Id FK_UserLoanPaymentRequests_UserLoanPayments_UserLoanPaymentId CASCADE NO_ACTION 0
dbo.UserLoanPayments UserLoanId dbo.UserLoans Id FK_UserLoanPayments_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
dbo.UserLoanProduct CustomerId dbo.Customers Id FK_UserLoanProduct_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanProduct ProductId dbo.Product Id FK_UserLoanProduct_Product_ProductId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestAuthorizationItemAttachments UserLoanRequestAuthorizationItemId dbo.UserLoanRequestAuthorizationItems Id FK_UserLoanRequestAuthorizationItemAttachments_UserLoanRequestAuthorizationItems_UserLoanRequestAuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems AuthorizationItemId dbo.AuthorizationItem Id FK_UserLoanRequestAuthorizationItems_AuthorizationItem_AuthorizationItemId CASCADE NO_ACTION 0
dbo.UserLoanRequestAuthorizationItems UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestAuthorizationItems_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestProduct CustomerId dbo.Customers Id FK_UserLoanRequestProduct_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestProduct ProductId dbo.Product Id FK_UserLoanRequestProduct_Product_ProductId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests AgentId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests SponsorId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_SponsorId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests UserId dbo.AspNetUsers Id FK_UserLoanRequests_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequests AgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_AgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests StatusId dbo.LoanRequestStatuses Id FK_UserLoanRequests_LoanRequestStatuses_StatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequests LoanId dbo.Loans Id FK_UserLoanRequests_Loans_LoanId CASCADE NO_ACTION 0
dbo.UserLoanRequestSponsorHistory UserId dbo.AspNetUsers Id FK_UserLoanRequestSponsorHistory_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequestSponsorHistory UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestSponsorHistory_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserId dbo.AspNetUsers Id FK_UserLoanRequestStatusHistories_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories FromStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_FromStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToAgentStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToAgentStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories ToStatusId dbo.LoanRequestStatuses Id FK_UserLoanRequestStatusHistories_LoanRequestStatuses_ToStatusId NO_ACTION NO_ACTION 0
dbo.UserLoanRequestStatusHistories UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoanRequestStatusHistories_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoans AgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.UserLoans SubAgentId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_SubAgentId NO_ACTION NO_ACTION 0
dbo.UserLoans UserId dbo.AspNetUsers Id FK_UserLoans_AspNetUsers_UserId CASCADE NO_ACTION 0
dbo.UserLoans CustomerPurchasePlanId dbo.CustomerPurchasePlan Id FK_UserLoans_CustomerPurchasePlan_CustomerPurchasePlanId NO_ACTION NO_ACTION 0
dbo.UserLoans LoanId dbo.Loans Id FK_UserLoans_Loans_LoanId NO_ACTION NO_ACTION 0
dbo.UserLoans UserLoanRequestId dbo.UserLoanRequests Id FK_UserLoans_UserLoanRequests_UserLoanRequestId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate CustomerId dbo.Customers Id FK_UserLoanSponsoreDueDate_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId CASCADE NO_ACTION 0
dbo.UserLoanSponsoreDueDate UserLoanId1 dbo.UserLoans Id FK_UserLoanSponsoreDueDate_UserLoans_UserLoanId1 NO_ACTION NO_ACTION 0
dbo.UserRefahBeta UserId dbo.AspNetUsers Id FK_UserRefahBeta_AspNetUsers_UserId NO_ACTION NO_ACTION 0
dbo.UserRefahBeta CustomerId dbo.Customers Id FK_UserRefahBeta_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.UserSavedMonies MemberId dbo.AspNetUsers Id FK_UserSavedMonies_AspNetUsers_MemberId CASCADE NO_ACTION 0
dbo.WithdrawAgentFactor AgentFactorId dbo.AgentFactors Id FK_WithdrawAgentFactor_AgentFactors_AgentFactorId NO_ACTION NO_ACTION 0
dbo.WithdrawAgentFactor WithdrawId dbo.Withdraws Id FK_WithdrawAgentFactor_Withdraws_WithdrawId NO_ACTION NO_ACTION 0
dbo.Withdraws AgentId dbo.AspNetUsers Id FK_Withdraws_AspNetUsers_AgentId NO_ACTION NO_ACTION 0
dbo.Withdraws ContactId dbo.Contacts Id FK_Withdraws_Contacts_ContactId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerMarketerCommissionId dbo.CustomerMarketerCommissions Id FK_Withdraws_CustomerMarketerCommissions_CustomerMarketerCommissionId NO_ACTION NO_ACTION 0
dbo.Withdraws CustomerId dbo.Customers Id FK_Withdraws_Customers_CustomerId NO_ACTION NO_ACTION 0
dbo.Withdraws SponsoredLoanId dbo.Loans Id FK_Withdraws_Loans_SponsoredLoanId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanContactId dbo.UserLoanContact Id FK_Withdraws_UserLoanContact_UserLoanContactId NO_ACTION NO_ACTION 0
dbo.Withdraws UserLoanId dbo.UserLoans Id FK_Withdraws_UserLoans_UserLoanId NO_ACTION NO_ACTION 0
HangFire.JobParameter JobId HangFire.Job Id FK_HangFire_JobParameter_Job CASCADE CASCADE 0
HangFire.State JobId HangFire.Job Id FK_HangFire_State_Job CASCADE CASCADE 0
```

### CHECK CONSTRAINTS

```text
schema_name table_name constraint_name definition is_disabled
----------- ---------- --------------- ---------- -----------
```

### TOTALS

```text
table_count column_count foreign_key_count check_constraint_count primary_key_count
----------- ------------ ----------------- ---------------------- -----------------
88 957 188 0 88
=== LEGACY DIGIBAIL ROLE COUNTS ===
role_name account_count
--------- -------------
Admin 1
SuperAdmin 1
=== IDENTITY DATA QUALITY COUNTS ONLY ===
source total missing_phone missing_password
------ ----- ------------- ----------------
AspNetUsers 2 2 0
source total missing_phone missing_password
------ ----- ------------- ----------------
Customers 1 1 1
=== READ ONLY INVENTORY COMPLETE; NO DATA MODIFIED ===
===============================================
✅ Successfully executed commands to all hosts.
===============================================
Cleaning up orphan processes
```

## نقش‌های ثبت‌شده در دیتابیس اصلی

```text
role_name account_count
--------- -------------
Admin 1
SuperAdmin 1
```

## کیفیت داده هویت، فقط شمارنده‌ها

```text
source total missing_phone missing_password
------ ----- ------------- ----------------
AspNetUsers 2 2 0
source total missing_phone missing_password
------ ----- ------------- ----------------
Customers 1 1 1
```

## محدودیت‌ها و تصمیم‌های مهاجرت

- در دیتابیس `Digibail` فقط ۲ کاربر در `AspNetUsers` دیده شد و هر دو فاقد شماره موبایل معتبر در ستون‌های بررسی‌شده هستند؛ رمز خالی نیست.
- جدول `Customers` در دیتابیس اصلی ۱ ردیف دارد که موبایل و رمز اولیه آن خالی است.
- نقش‌های موجود: `Agent`، `SuperAdmin`، `Marketer`، `CustomerMarketer`، `Admin` و `Member`. در شمارش تخصیص نقش‌ها، یک حساب `Admin` و یک حساب `SuperAdmin` ثبت شده است.
- جدول‌های اصلی کسب‌وکار در دیتابیس `Digibail` عمدتاً خالی‌اند؛ داده عملیاتی حجیم‌تر در پایگاه‌های واردشده BlueVam و VamCity دیده می‌شود. بنابراین استفاده از دیتابیس اصلی به‌تنهایی، انتقال کامل کاربران/وام/پرداخت را ثابت نمی‌کند.
- پیش از انتقال باید جداول و داده‌های چهار پایگاه، کلیدهای GUID و BIGINT، کلیدهای خارجی، نسخه‌های migration، رکوردهای تکراری و ارتباط هر موجودیت با tenant/customer تطبیق داده شوند.
- هیچ migration یا import روی MariaDB/PostgreSQL production اجرا نشده است. این گزارش مجوز انتقال یا حذف هیچ جدولی نیست.
