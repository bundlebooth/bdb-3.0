
-- Get album images
CREATE   PROCEDURE sp_GetAlbumImages
    @AlbumID INT,
    @VendorProfileID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify ownership if VendorProfileID is provided
    IF @VendorProfileID IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM VendorPortfolioAlbums 
        WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID
    )
    BEGIN
        RAISERROR('Album not found or access denied.', 16, 1);
        RETURN;
    END
    
    SELECT 
        PortfolioImageID,
        AlbumID,
        VendorProfileID,
        ImageURL,
        CloudinaryPublicId,
        CloudinaryUrl,
        CloudinarySecureUrl,
        Caption,
        DisplayOrder,
        CreatedAt
    FROM VendorPortfolioImages
    WHERE AlbumID = @AlbumID
    ORDER BY DisplayOrder, CreatedAt;
END;

GO

