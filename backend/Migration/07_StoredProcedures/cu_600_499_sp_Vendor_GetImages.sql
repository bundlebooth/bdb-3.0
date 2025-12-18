-- =============================================
-- Stored Procedure: vendors.sp_GetImages
-- Description: Gets vendor images
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetImages]'))
    DROP PROCEDURE [vendors].[sp_GetImages];
GO

CREATE PROCEDURE [vendors].[sp_GetImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ImageID, ImageURL, Caption, IsPrimary, DisplayOrder, ImageType
    FROM vendors.VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END
GO

