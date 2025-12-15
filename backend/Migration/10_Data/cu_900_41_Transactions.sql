/*
    Migration Script: Data - [Transactions]
    Phase: 900 - Data
    Script: cu_900_41_dbo.Transactions.sql
    Description: Inserts data into [dbo].[Transactions]
    
    Execution Order: 41
    Record Count: 21
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[Transactions]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[Transactions])
BEGIN
    SET IDENTITY_INSERT [dbo].[Transactions] ON;

    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (1, 144, 138, 40, CAST(1000.00 AS Decimal(10, 2)), CAST(29.30 AS Decimal(10, 2)), CAST(970.70 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SHpivFJtS8tRcsD1nKtpNRQ', N'succeeded', CAST(N'2025-10-13T17:40:15.473' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (2, 144, 138, 40, CAST(1000.00 AS Decimal(10, 2)), CAST(29.30 AS Decimal(10, 2)), CAST(970.70 AS Decimal(10, 2)), N'USD', N'Stripe Charge', N'ch_3SHpivFJtS8tRcsD141wui9X', N'succeeded', CAST(N'2025-10-13T17:40:15.987' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (3, 144, 138, 42, CAST(1000.00 AS Decimal(10, 2)), CAST(29.30 AS Decimal(10, 2)), CAST(970.70 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SHqcpFJtS8tRcsD00Ere2JN', N'succeeded', CAST(N'2025-10-13T18:38:03.700' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (4, 144, 138, 43, CAST(677.70 AS Decimal(10, 2)), CAST(19.95 AS Decimal(10, 2)), CAST(657.75 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SHrAUFJtS8tRcsD0Mi1Rq61', N'succeeded', CAST(N'2025-10-13T19:13:08.063' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (5, 144, 138, 44, CAST(1129.30 AS Decimal(10, 2)), CAST(33.05 AS Decimal(10, 2)), CAST(1096.25 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SHrByFJtS8tRcsD1nv18FNw', N'succeeded', CAST(N'2025-10-13T19:14:20.527' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (6, 144, 138, 37, CAST(1129.30 AS Decimal(10, 2)), CAST(33.05 AS Decimal(10, 2)), CAST(1096.25 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SIKtjFJtS8tRcsD1eMtINA3', N'succeeded', CAST(N'2025-10-15T02:57:27.730' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (7, 144, 138, 41, CAST(1100.00 AS Decimal(10, 2)), CAST(32.20 AS Decimal(10, 2)), CAST(1067.80 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SIypbFJtS8tRcsD1YNT3PIp', N'succeeded', CAST(N'2025-10-16T21:36:14.070' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (8, 144, 138, 39, CAST(660.00 AS Decimal(10, 2)), CAST(19.44 AS Decimal(10, 2)), CAST(640.56 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SJ3dhFJtS8tRcsD1ivA0LQX', N'succeeded', CAST(N'2025-10-17T02:44:01.623' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (9, 144, 138, 39, CAST(600.00 AS Decimal(10, 2)), CAST(17.70 AS Decimal(10, 2)), CAST(582.30 AS Decimal(10, 2)), N'USD', N'Stripe Payment (webhook PI)', N'pi_3SJ3dhFJtS8tRcsD1ivA0LQX', N'succeeded', CAST(N'2025-10-17T02:44:01.640' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (10, 144, 138, 48, CAST(677.70 AS Decimal(10, 2)), CAST(19.95 AS Decimal(10, 2)), CAST(657.75 AS Decimal(10, 2)), N'USD', N'Stripe Payment (verified)', N'pi_3SKpysFJtS8tRcsD0RLumWyN', N'succeeded', CAST(N'2025-10-22T00:33:09.820' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (11, 144, 138, 57, CAST(660.90 AS Decimal(10, 2)), CAST(19.47 AS Decimal(10, 2)), CAST(641.43 AS Decimal(10, 2)), N'CAD', N'Stripe Payment (verified)', N'pi_3SLpvdFJtS8tRcsD1LMfL1Er', N'succeeded', CAST(N'2025-10-24T18:41:52.373' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (12, 144, 138, 51, CAST(660.90 AS Decimal(10, 2)), CAST(19.47 AS Decimal(10, 2)), CAST(641.43 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'py_3SPwe9FJtS8tRcsD18K97Isy', N'succeeded', CAST(N'2025-11-05T02:40:53.917' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (13, 144, 138, 52, CAST(1129.30 AS Decimal(10, 2)), CAST(33.05 AS Decimal(10, 2)), CAST(1096.25 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3SctDWFJtS8tRcsD1xiqsyos', N'succeeded', CAST(N'2025-12-10T19:38:33.973' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (14, 144, 138, 45, CAST(1215.80 AS Decimal(10, 2)), CAST(35.56 AS Decimal(10, 2)), CAST(1180.24 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScuUeFJtS8tRcsD1Z2VaZ9U', N'succeeded', CAST(N'2025-12-10T21:00:19.633' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (15, 144, 138, 50, CAST(729.60 AS Decimal(10, 2)), CAST(21.46 AS Decimal(10, 2)), CAST(708.14 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3Scun8FJtS8tRcsD1bWzbuRX', N'succeeded', CAST(N'2025-12-10T21:19:25.093' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (16, 144, 138, 46, CAST(1215.80 AS Decimal(10, 2)), CAST(35.56 AS Decimal(10, 2)), CAST(1180.24 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScuorFJtS8tRcsD0o5XBNYq', N'succeeded', CAST(N'2025-12-10T21:21:12.340' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (17, 144, 138, 66, CAST(729.60 AS Decimal(10, 2)), CAST(21.46 AS Decimal(10, 2)), CAST(708.14 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3Scv7uFJtS8tRcsD0Bbf67xI', N'succeeded', CAST(N'2025-12-10T21:40:53.280' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (18, 144, 138, 63, CAST(1215.80 AS Decimal(10, 2)), CAST(35.56 AS Decimal(10, 2)), CAST(1180.24 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScvGfFJtS8tRcsD0G0rTp9s', N'succeeded', CAST(N'2025-12-10T21:49:56.197' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (19, 144, 138, 61, CAST(1215.80 AS Decimal(10, 2)), CAST(35.56 AS Decimal(10, 2)), CAST(1180.24 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScvJ4FJtS8tRcsD11lHxXzF', N'succeeded', CAST(N'2025-12-10T21:52:24.640' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (20, 144, 138, 62, CAST(1215.80 AS Decimal(10, 2)), CAST(35.56 AS Decimal(10, 2)), CAST(1180.24 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScvKhFJtS8tRcsD1fuO0xrK', N'succeeded', CAST(N'2025-12-10T21:54:06.003' AS DateTime));
    INSERT [dbo].[Transactions] ([TransactionID], [UserID], [VendorProfileID], [BookingID], [Amount], [FeeAmount], [NetAmount], [Currency], [Description], [StripeChargeID], [Status], [CreatedAt]) VALUES (21, 144, 138, 67, CAST(729.60 AS Decimal(10, 2)), CAST(21.46 AS Decimal(10, 2)), CAST(708.14 AS Decimal(10, 2)), N'CAD', N'Stripe Charge', N'ch_3ScwbCFJtS8tRcsD1yicoInQ', N'succeeded', CAST(N'2025-12-10T23:15:12.457' AS DateTime));

    SET IDENTITY_INSERT [dbo].[Transactions] OFF;

    PRINT 'Inserted 21 records into [dbo].[Transactions].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[Transactions] already contains data. Skipping.';
END
GO
