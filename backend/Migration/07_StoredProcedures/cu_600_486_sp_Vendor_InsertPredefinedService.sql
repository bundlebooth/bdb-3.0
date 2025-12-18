-- =============================================
-- Stored Procedure: sp_Vendor_InsertPredefinedService
-- Description: Inserts a vendor predefined service
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertPredefinedService]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertPredefinedService];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertPredefinedService]
    @VendorProfileID INT,
    @PredefinedServiceID INT,
    @VendorPrice DECIMAL(10,2),
    @VendorDuration INT = NULL,
    @VendorDescription NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorPredefinedServices 
    (VendorProfileID, PredefinedServiceID, VendorPrice, VendorDuration, VendorDescription, IsActive, CreatedAt)
    VALUES 
    (@VendorProfileID, @PredefinedServiceID, @VendorPrice, @VendorDuration, @VendorDescription, 1, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS VendorPredefinedServiceID;
END
GO
