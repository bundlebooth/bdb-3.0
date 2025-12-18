/*
    Migration Script: Create Stored Procedure [sp_UpsertPortfolioAlbum]
    Phase: 600 - Stored Procedures
    Script: cu_600_115_dbo.sp_UpsertPortfolioAlbum.sql
    Description: Creates the [vendors].[sp_UpsertPortfolioAlbum] stored procedure
    
    Execution Order: 115
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpsertPortfolioAlbum]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertPortfolioAlbum]'))
    DROP PROCEDURE [vendors].[sp_UpsertPortfolioAlbum];
GO

CREATE   PROCEDURE [vendors].[sp_UpsertPortfolioAlbum]
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

PRINT 'Stored procedure [vendors].[sp_UpsertPortfolioAlbum] created successfully.';
GO
