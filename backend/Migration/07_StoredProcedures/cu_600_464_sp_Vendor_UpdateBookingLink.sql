-- =============================================
-- Stored Procedure: sp_Vendor_UpdateBookingLink
-- Description: Updates vendor booking link
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateBookingLink]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateBookingLink];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateBookingLink]
    @VendorProfileID INT,
    @BookingLink NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET BookingLink = @BookingLink, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
