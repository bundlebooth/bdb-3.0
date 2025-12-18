-- =============================================
-- Stored Procedure: sp_Vendor_InsertSelectedFeature
-- Description: Inserts a selected feature for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertSelectedFeature]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertSelectedFeature];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertSelectedFeature]
    @VendorProfileID INT,
    @FeatureID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorSelectedFeatures (VendorProfileID, FeatureID, CreatedAt)
    VALUES (@VendorProfileID, @FeatureID, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS VendorFeatureSelectionID;
END
GO
