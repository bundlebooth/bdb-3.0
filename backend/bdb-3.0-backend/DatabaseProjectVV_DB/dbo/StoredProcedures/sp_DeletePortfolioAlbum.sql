
-- Delete album (and all its images)
CREATE   PROCEDURE sp_DeletePortfolioAlbum
    @AlbumID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM VendorPortfolioAlbums 
        WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID
    )
    BEGIN
        -- Images will be deleted automatically due to CASCADE
        DELETE FROM VendorPortfolioAlbums WHERE AlbumID = @AlbumID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Album not found or access denied.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

