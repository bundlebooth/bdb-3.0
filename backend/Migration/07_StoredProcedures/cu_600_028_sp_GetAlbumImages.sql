/*
    Migration Script: Create Stored Procedure [sp_GetAlbumImages]
    Phase: 600 - Stored Procedures
    Script: cu_600_028_dbo.sp_GetAlbumImages.sql
    Description: Creates the [vendors].[sp_GetAlbumImages] stored procedure
    
    Execution Order: 28
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetAlbumImages]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetAlbumImages]'))
    DROP PROCEDURE [vendors].[sp_GetAlbumImages];
GO

CREATE   PROCEDURE [vendors].[sp_GetAlbumImages]
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
    FROM vendors.VendorPortfolioImages
    WHERE AlbumID = @AlbumID
    ORDER BY DisplayOrder, CreatedAt;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetAlbumImages] created successfully.';
GO

