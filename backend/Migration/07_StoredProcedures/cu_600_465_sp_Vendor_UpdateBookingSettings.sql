-- =============================================
-- Stored Procedure: sp_Vendor_UpdateBookingSettings
-- Description: Updates vendor booking settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateBookingSettings]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateBookingSettings];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateBookingSettings]
    @VendorProfileID INT,
    @AcceptingBookings BIT = 0,
    @AverageResponseTime INT = 24
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET AcceptingBookings = @AcceptingBookings, 
        AverageResponseTime = @AverageResponseTime,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
