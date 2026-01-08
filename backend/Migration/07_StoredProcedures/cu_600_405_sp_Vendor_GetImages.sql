-- =============================================
-- Stored Procedure: vendors.sp_GetImages
-- Description: Gets vendor images for gallery
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetImages]'))
    DROP PROCEDURE [vendors].[sp_GetImages];
GO

CREATE PROCEDURE [vendors].[sp_GetImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ImageID,
        ImageURL,
        IsPrimary,
        DisplayOrder,
        ImageType,
        Caption
    FROM vendors.VendorImages 
    WHERE VendorProfileID = @VendorProfileID 
    ORDER BY IsPrimary DESC, DisplayOrder ASC;
END
GO

