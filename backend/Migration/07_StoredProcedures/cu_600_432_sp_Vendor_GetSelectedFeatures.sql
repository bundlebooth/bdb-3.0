-- =============================================
-- Stored Procedure: vendors.sp_GetSelectedFeatures
-- Description: Gets selected features for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSelectedFeatures]'))
    DROP PROCEDURE [vendors].[sp_GetSelectedFeatures];
GO

CREATE PROCEDURE [vendors].[sp_GetSelectedFeatures]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT FeatureID FROM vendors.VendorSelectedFeatures 
    WHERE VendorProfileID = @VendorProfileID;
END
GO

