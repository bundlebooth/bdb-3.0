
-- Create or update album
CREATE   PROCEDURE sp_UpsertPortfolioAlbum
    @AlbumID INT = NULL,
    @VendorProfileID INT,
    @AlbumName NVARCHAR(100),
    @AlbumDescription NVARCHAR(500) = NULL,
    @CoverImageURL NVARCHAR(500) = NULL,
    @CloudinaryPublicId NVARCHAR(200) = NULL,
    @IsPublic BIT = 1,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @AlbumID IS NULL OR @AlbumID = 0
    BEGIN
        -- Create new album
        INSERT INTO VendorPortfolioAlbums (
            VendorProfileID, AlbumName, AlbumDescription, CoverImageURL, 
            CloudinaryPublicId, IsPublic, DisplayOrder, CreatedAt, UpdatedAt
        )
        VALUES (
            @VendorProfileID, @AlbumName, @AlbumDescription, @CoverImageURL,
            @CloudinaryPublicId, @IsPublic, @DisplayOrder, GETUTCDATE(), GETUTCDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS AlbumID;
    END
    ELSE
    BEGIN
        -- Update existing album
        UPDATE VendorPortfolioAlbums
        SET 
            AlbumName = @AlbumName,
            AlbumDescription = @AlbumDescription,
            CoverImageURL = @CoverImageURL,
            CloudinaryPublicId = @CloudinaryPublicId,
            IsPublic = @IsPublic,
            DisplayOrder = @DisplayOrder,
            UpdatedAt = GETUTCDATE()
        WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID;
        
        SELECT @AlbumID AS AlbumID;
    END
END;

GO

