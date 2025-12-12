
-- =============================================
-- PORTFOLIO ALBUMS STORED PROCEDURES
-- =============================================

-- Get all albums for a vendor
CREATE   PROCEDURE sp_GetVendorPortfolioAlbums
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        a.AlbumID,
        a.VendorProfileID,
        a.AlbumName,
        a.AlbumDescription,
        a.CoverImageURL,
        a.CloudinaryPublicId,
        a.IsPublic,
        a.DisplayOrder,
        a.CreatedAt,
        a.UpdatedAt,
        (SELECT COUNT(*) FROM VendorPortfolioImages WHERE AlbumID = a.AlbumID) AS ImageCount
    FROM VendorPortfolioAlbums a
    WHERE a.VendorProfileID = @VendorProfileID
    ORDER BY a.DisplayOrder, a.CreatedAt DESC;
END;

GO

