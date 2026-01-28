/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateBookingSettings]
    Phase: 700 - Stored Procedures
    Script: pb_700_534_sp_Vendor_UpdateBookingSettings.sql
    Description: Updates vendor instant booking and lead time settings
    
    Execution Order: 534
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_UpdateBookingSettings]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_UpdateBookingSettings]'))
    DROP PROCEDURE [vendors].[sp_Vendor_UpdateBookingSettings];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_UpdateBookingSettings]
    @VendorProfileID INT,
    @InstantBookingEnabled BIT,
    @MinBookingLeadTimeHours INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [vendors].[VendorProfiles]
    SET 
        InstantBookingEnabled = @InstantBookingEnabled,
        MinBookingLeadTimeHours = @MinBookingLeadTimeHours,
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateBookingSettings] created successfully.';
GO
