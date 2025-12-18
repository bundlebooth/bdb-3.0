-- =============================================
-- Stored Procedure: sp_Vendor_UpdateSelectedService
-- Description: Updates a selected service for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateSelectedService]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateSelectedService];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateSelectedService]
    @VendorSelectedServiceID INT,
    @VendorProfileID INT,
    @VendorPrice DECIMAL(10,2) = NULL,
    @VendorDescription NVARCHAR(MAX) = NULL,
    @VendorDurationMinutes INT = NULL,
    @ImageURL NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorSelectedServices
    SET 
        VendorPrice = ISNULL(@VendorPrice, VendorPrice),
        VendorDescription = @VendorDescription,
        VendorDurationMinutes = @VendorDurationMinutes,
        ImageURL = @ImageURL,
        UpdatedAt = GETDATE()
    WHERE VendorSelectedServiceID = @VendorSelectedServiceID
        AND VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
