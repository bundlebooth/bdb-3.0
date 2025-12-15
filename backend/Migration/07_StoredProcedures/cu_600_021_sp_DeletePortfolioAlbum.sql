/*
    Migration Script: Create Stored Procedure [sp_DeletePortfolioAlbum]
    Phase: 600 - Stored Procedures
    Script: cu_600_021_dbo.sp_DeletePortfolioAlbum.sql
    Description: Creates the [dbo].[sp_DeletePortfolioAlbum] stored procedure
    
    Execution Order: 21
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_DeletePortfolioAlbum]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_DeletePortfolioAlbum]'))
    DROP PROCEDURE [dbo].[sp_DeletePortfolioAlbum];
GO

CREATE   PROCEDURE [dbo].[sp_DeletePortfolioAlbum]
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

PRINT 'Stored procedure [dbo].[sp_DeletePortfolioAlbum] created successfully.';
GO
