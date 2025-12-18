-- =============================================
-- Stored Procedure: vendors.sp_InsertPredefinedService
-- Description: Inserts a vendor predefined service
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertPredefinedService]'))
    DROP PROCEDURE [vendors].[sp_InsertPredefinedService];
GO

CREATE PROCEDURE [vendors].[sp_InsertPredefinedService]
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
