-- =============================================
-- Stored Procedure: sp_GetVendorSelectedFeatures
-- Description: Gets selected features for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorSelectedFeatures]'))
    DROP PROCEDURE [dbo].[sp_GetVendorSelectedFeatures];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorSelectedFeatures]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT FeatureID FROM VendorSelectedFeatures WHERE VendorProfileID = @VendorProfileID;
END
GO
