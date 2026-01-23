-- =============================================
-- Stored Procedure: vendors.sp_InsertSelectedFeature
-- Description: Inserts a selected feature for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertSelectedFeature]'))
    DROP PROCEDURE [vendors].[sp_InsertSelectedFeature];
GO

CREATE PROCEDURE [vendors].[sp_InsertSelectedFeature]
    @VendorProfileID INT,
    @FeatureID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorSelectedFeatures (VendorProfileID, FeatureID, CreatedAt)
    VALUES (@VendorProfileID, @FeatureID, GETDATE());
    
    SELECT SCOPE_IDENTITY() AS VendorFeatureSelectionID;
END
GO

