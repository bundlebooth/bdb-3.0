/*
    Migration Script: Add Cancelled Status columns to Bookings
    Phase: 200 - Alter Tables
    Script: cu_200_60_Bookings_AddCancelledStatus.sql
    Description: Adds CancelledBy column to track who cancelled (client/vendor)
    
    Execution Order: 60
*/

SET NOCOUNT ON;
GO

PRINT 'Adding CancelledBy column to [bookings].[Bookings]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[bookings].[Bookings]') AND name = 'CancelledBy')
BEGIN
    ALTER TABLE [bookings].[Bookings]
    ADD [CancelledBy] [nvarchar](20) NULL;
    PRINT 'Column CancelledBy added successfully.';
END
ELSE
BEGIN
    PRINT 'Column CancelledBy already exists. Skipping.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[bookings].[Bookings]') AND name = 'CancelledByUserID')
BEGIN
    ALTER TABLE [bookings].[Bookings]
    ADD [CancelledByUserID] [int] NULL;
    PRINT 'Column CancelledByUserID added successfully.';
END
ELSE
BEGIN
    PRINT 'Column CancelledByUserID already exists. Skipping.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[bookings].[Bookings]') AND name = 'CancellationReason')
BEGIN
    ALTER TABLE [bookings].[Bookings]
    ADD [CancellationReason] [nvarchar](max) NULL;
    PRINT 'Column CancellationReason added successfully.';
END
ELSE
BEGIN
    PRINT 'Column CancellationReason already exists. Skipping.';
END
GO

