-- =============================================
-- Stored Procedure: sp_Vendors_GetImages
-- Description: Gets all images for a vendor profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendors_GetImages]'))
    DROP PROCEDURE [dbo].[sp_Vendors_GetImages];
GO

CREATE PROCEDURE [dbo].[sp_Vendors_GetImages]
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
    FROM VendorImages 
    WHERE VendorProfileID = @VendorProfileID 
    ORDER BY IsPrimary DESC, DisplayOrder ASC;
END
GO
