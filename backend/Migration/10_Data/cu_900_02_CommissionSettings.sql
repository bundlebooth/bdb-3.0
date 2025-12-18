/*
    Migration Script: Data - [CommissionSettings]
    Phase: 900 - Data
    Script: cu_900_02_dbo.CommissionSettings.sql
    Description: Inserts data into [admin].[CommissionSettings]
    
    Execution Order: 2
    Record Count: 11
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[CommissionSettings]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[CommissionSettings])
BEGIN
    SET IDENTITY_INSERT [admin].[CommissionSettings] ON;

    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (1, N'platform_commission_rate', N'15', N'Platform commission percentage taken from vendor payouts', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(50.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (2, N'renter_processing_fee_rate', N'5', N'Processing fee percentage charged to renters/customers', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(20.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (3, N'minimum_booking_amount', N'25', N'Minimum booking amount in dollars', N'fixed', CAST(0.00 AS Decimal(10, 2)), CAST(1000.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (4, N'stripe_application_fee_rate', N'2.9', N'Stripe''s base processing fee percentage', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(10.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (5, N'stripe_fixed_fee', N'0.30', N'Stripe''s fixed fee per transaction in dollars', N'fixed', CAST(0.00 AS Decimal(10, 2)), CAST(5.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (6, N'instant_payout_enabled', N'false', N'W', N'boolean', NULL, NULL, 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T22:40:49.5533333' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (7, N'payout_delay_days', N'7', N'Number of days to hold funds before vendor payout', N'fixed', CAST(0.00 AS Decimal(10, 2)), CAST(30.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2), CAST(N'2025-12-10T18:59:37.4766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (8, N'platform_fee_percent', N'5', N'Platform commission percentage charged on each booking', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(50.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T20:43:45.0766667' AS DateTime2), CAST(N'2025-12-10T20:43:45.0766667' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (9, N'stripe_fee_percent', N'2.9', N'Stripe processing fee percentage', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(10.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T20:43:45.0800000' AS DateTime2), CAST(N'2025-12-10T20:43:45.0800000' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (10, N'stripe_fee_fixed', N'0.30', N'Stripe fixed fee per transaction (CAD)', N'currency', CAST(0.00 AS Decimal(10, 2)), CAST(5.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T20:43:45.0833333' AS DateTime2), CAST(N'2025-12-10T20:43:45.0833333' AS DateTime2));
    INSERT [admin].[CommissionSettings] ([SettingID], [SettingKey], [SettingValue], [Description], [SettingType], [MinValue], [MaxValue], [IsActive], [CreatedAt], [UpdatedAt]) VALUES (11, N'tax_percent', N'13', N'HST tax percentage (Ontario)', N'percentage', CAST(0.00 AS Decimal(10, 2)), CAST(20.00 AS Decimal(10, 2)), 1, CAST(N'2025-12-10T20:43:45.0900000' AS DateTime2), CAST(N'2025-12-10T20:43:45.0900000' AS DateTime2));

    SET IDENTITY_INSERT [admin].[CommissionSettings] OFF;

    PRINT 'Inserted 11 records into [admin].[CommissionSettings].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[CommissionSettings] already contains data. Skipping.';
END
GO
