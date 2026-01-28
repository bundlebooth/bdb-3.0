/*
    Migration Script: Create Stored Procedure [sp_Vendor_UpdateBookingSettings]
    Phase: 700 - Stored Procedures
    Script: pb_700_557_sp_Vendor_UpdateBookingSettings.sql
    Description: Updates vendor booking settings (instant booking, lead time)
    
    Execution Order: 557
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
    @InstantBookingEnabled BIT = NULL,
    @MinBookingLeadTimeHours INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [vendors].[VendorProfiles]
    SET 
        InstantBookingEnabled = COALESCE(@InstantBookingEnabled, InstantBookingEnabled),
        MinBookingLeadTimeHours = COALESCE(@MinBookingLeadTimeHours, MinBookingLeadTimeHours),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_UpdateBookingSettings] created successfully.';
GO
