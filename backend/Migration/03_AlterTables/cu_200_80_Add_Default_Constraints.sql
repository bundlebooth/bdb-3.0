/*
    Migration Script: Add Default Constraints
    Description: Adds default constraints to prevent NULL values in key columns
    
    Execution Order: 80
*/

SET NOCOUNT ON;
GO

PRINT 'Adding default constraints...';
GO

-- =============================================
-- users.Users defaults
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Users_Phone')
    ALTER TABLE users.Users ADD CONSTRAINT DF_Users_Phone DEFAULT '' FOR Phone;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Users_Bio')
    ALTER TABLE users.Users ADD CONSTRAINT DF_Users_Bio DEFAULT '' FOR Bio;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Users_ProfileImageURL')
    ALTER TABLE users.Users ADD CONSTRAINT DF_Users_ProfileImageURL DEFAULT '' FOR ProfileImageURL;
GO

-- =============================================
-- bookings.Bookings defaults
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Bookings_EventLocation')
    ALTER TABLE bookings.Bookings ADD CONSTRAINT DF_Bookings_EventLocation DEFAULT '' FOR EventLocation;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Bookings_EventName')
    ALTER TABLE bookings.Bookings ADD CONSTRAINT DF_Bookings_EventName DEFAULT 'Booking' FOR EventName;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Bookings_Services')
    ALTER TABLE bookings.Bookings ADD CONSTRAINT DF_Bookings_Services DEFAULT '[]' FOR Services;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_Bookings_GroupID')
    ALTER TABLE bookings.Bookings ADD CONSTRAINT DF_Bookings_GroupID DEFAULT '' FOR GroupID;
GO

-- =============================================
-- vendors.VendorProfiles defaults
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_BusinessPhone')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_BusinessPhone DEFAULT '' FOR BusinessPhone;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_BusinessEmail')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_BusinessEmail DEFAULT '' FOR BusinessEmail;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_Website')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_Website DEFAULT '' FOR Website;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_LogoURL')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_LogoURL DEFAULT '' FOR LogoURL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_AvgRating')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_AvgRating DEFAULT 0 FOR AvgRating;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_TotalBookings')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_TotalBookings DEFAULT 0 FOR TotalBookings;
GO

IF NOT EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_VendorProfiles_TotalReviews')
    ALTER TABLE vendors.VendorProfiles ADD CONSTRAINT DF_VendorProfiles_TotalReviews DEFAULT 0 FOR TotalReviews;
GO

PRINT 'Default constraints added successfully.';
GO
