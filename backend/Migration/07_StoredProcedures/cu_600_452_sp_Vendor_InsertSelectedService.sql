-- =============================================
-- Stored Procedure: sp_Vendor_InsertSelectedService
-- Description: Inserts a selected service for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertSelectedService]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertSelectedService];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertSelectedService]
    @VendorProfileID INT,
    @PredefinedServiceID INT,
    @VendorPrice DECIMAL(10,2) = 0,
    @VendorDescription NVARCHAR(MAX) = NULL,
    @VendorDurationMinutes INT = NULL,
    @ImageURL NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorSelectedServices 
    (VendorProfileID, PredefinedServiceID, VendorPrice, VendorDescription, VendorDurationMinutes, ImageURL, IsActive, CreatedAt, UpdatedAt)
    VALUES 
    (@VendorProfileID, @PredefinedServiceID, @VendorPrice, @VendorDescription, @VendorDurationMinutes, @ImageURL, 1, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() AS VendorSelectedServiceID;
END
GO
