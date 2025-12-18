-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetPublicAlbums
-- Description: Gets public portfolio albums
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetPublicAlbums]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetPublicAlbums];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetPublicAlbums]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pa.AlbumID,
        pa.AlbumName,
        pa.AlbumDescription,
        pa.CoverImageURL,
        pa.DisplayOrder,
        pa.CreatedAt,
        (SELECT COUNT(*) FROM vendors.VendorPortfolioImages WHERE AlbumID = pa.AlbumID) as ImageCount
    FROM VendorPortfolioAlbums pa
    WHERE pa.VendorProfileID = @VendorProfileID 
        AND pa.IsPublic = 1
    ORDER BY pa.DisplayOrder, pa.CreatedAt DESC;
END
GO

