/*
    Migration Script: Add Guest Favorite Column to VendorProfiles
    Phase: 200 - Alter Tables
    Description: Adds IsGuestFavorite column for admin-controlled guest favorite status
    
    Guest Favorite Formula (suggested criteria):
    - Average Rating >= 4.5
    - Review Count >= 5
    - Total Bookings >= 10
    - Response Rate >= 90%
    
    Admin can manually grant/revoke this status.
*/

SET NOCOUNT ON;
GO

PRINT 'Adding IsGuestFavorite column to [vendors].[VendorProfiles]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'IsGuestFavorite')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles]
    ADD [IsGuestFavorite] [bit] CONSTRAINT DF_VendorProfiles_IsGuestFavorite DEFAULT 0 NOT NULL;
    
    PRINT 'Column [IsGuestFavorite] added successfully.';
END
ELSE
BEGIN
    PRINT 'Column [IsGuestFavorite] already exists. Skipping.';
END
GO

-- Add column to track when guest favorite status was granted
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'GuestFavoriteGrantedAt')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles]
    ADD [GuestFavoriteGrantedAt] [datetime] NULL;
    
    PRINT 'Column [GuestFavoriteGrantedAt] added successfully.';
END
GO

-- Add column to track who granted guest favorite status
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[VendorProfiles]') AND name = 'GuestFavoriteGrantedBy')
BEGIN
    ALTER TABLE [vendors].[VendorProfiles]
    ADD [GuestFavoriteGrantedBy] [int] NULL;
    
    PRINT 'Column [GuestFavoriteGrantedBy] added successfully.';
END
GO

PRINT 'Guest Favorite migration completed.';
GO
