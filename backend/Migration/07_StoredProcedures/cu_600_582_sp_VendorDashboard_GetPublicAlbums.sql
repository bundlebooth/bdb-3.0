-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetPublicAlbums
-- Description: Gets public portfolio albums
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetPublicAlbums]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetPublicAlbums];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetPublicAlbums]
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
        (SELECT COUNT(*) FROM VendorPortfolioImages WHERE AlbumID = pa.AlbumID) as ImageCount
    FROM VendorPortfolioAlbums pa
    WHERE pa.VendorProfileID = @VendorProfileID 
        AND pa.IsPublic = 1
    ORDER BY pa.DisplayOrder, pa.CreatedAt DESC;
END
GO
