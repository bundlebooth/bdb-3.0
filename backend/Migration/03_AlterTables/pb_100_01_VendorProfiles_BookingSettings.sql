/*
    Migration Script: Alter Table [VendorProfiles] - Add Booking Settings
    Phase: 100 - Alter Tables
    Script: pb_100_01_VendorProfiles_BookingSettings.sql
    Description: Adds booking settings fields to [vendors].[VendorProfiles] table
    
    Fields Added:
    - MinBookingHours: Minimum booking duration in hours
    - AdvanceNoticeHours: How far in advance bookings must be made
    - MaxCapacity: Maximum number of people/guests
    - OffersHourlyRates: Whether vendor offers hourly pricing
*/

SET NOCOUNT ON;
GO

PRINT 'Altering table [vendors].[VendorProfiles] - Adding booking settings fields...';
GO

-- Add MinBookingHours column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MinBookingHours')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [MinBookingHours] [decimal](4, 1) NULL;
    PRINT 'Column [MinBookingHours] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [MinBookingHours] already exists. Skipping.';
END
GO

-- Add AdvanceNoticeHours column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'AdvanceNoticeHours')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [AdvanceNoticeHours] [int] NULL;
    PRINT 'Column [AdvanceNoticeHours] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [AdvanceNoticeHours] already exists. Skipping.';
END
GO

-- Add MaxCapacity column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'MaxCapacity')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [MaxCapacity] [int] NULL;
    PRINT 'Column [MaxCapacity] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [MaxCapacity] already exists. Skipping.';
END
GO

-- Add OffersHourlyRates column
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'OffersHourlyRates')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles] ADD [OffersHourlyRates] [bit] CONSTRAINT DF_VendorProfiles_OffersHourlyRates DEFAULT 1 NULL;
    PRINT 'Column [OffersHourlyRates] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [OffersHourlyRates] already exists. Skipping.';
END
GO

PRINT 'Alter table [vendors].[VendorProfiles] completed.';
GO
