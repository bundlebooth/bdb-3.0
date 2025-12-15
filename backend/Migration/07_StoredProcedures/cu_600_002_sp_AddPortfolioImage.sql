/*
    Migration Script: Create Stored Procedure [sp_AddPortfolioImage]
    Phase: 600 - Stored Procedures
    Script: cu_600_002_dbo.sp_AddPortfolioImage.sql
    Description: Creates the [dbo].[sp_AddPortfolioImage] stored procedure
    
    Execution Order: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_AddPortfolioImage]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_AddPortfolioImage]'))
    DROP PROCEDURE [dbo].[sp_AddPortfolioImage];
GO

CREATE   PROCEDURE [dbo].[sp_AddPortfolioImage]
    @AlbumID INT,
    @VendorProfileID INT,
    @ImageURL NVARCHAR(500),
    @CloudinaryPublicId NVARCHAR(200) = NULL,
    @CloudinaryUrl NVARCHAR(500) = NULL,
    @CloudinarySecureUrl NVARCHAR(500) = NULL,
    @Caption NVARCHAR(255) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Verify album ownership
    IF NOT EXISTS (
        SELECT 1 FROM VendorPortfolioAlbums 
        WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID
    )
    BEGIN
        RAISERROR('Album not found or access denied.', 16, 1);
        RETURN;
    END
    
    INSERT INTO VendorPortfolioImages (
        AlbumID, VendorProfileID, ImageURL, CloudinaryPublicId,
        CloudinaryUrl, CloudinarySecureUrl, Caption, DisplayOrder, CreatedAt
    )
    VALUES (
        @AlbumID, @VendorProfileID, @ImageURL, @CloudinaryPublicId,
        @CloudinaryUrl, @CloudinarySecureUrl, @Caption, @DisplayOrder, GETUTCDATE()
    );
    
    SELECT SCOPE_IDENTITY() AS PortfolioImageID;
END;

GO

PRINT 'Stored procedure [dbo].[sp_AddPortfolioImage] created successfully.';
GO
