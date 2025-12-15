/*
    Migration Script: Create Stored Procedure [sp_GetVendorPortfolioAlbums]
    Phase: 600 - Stored Procedures
    Script: cu_600_070_dbo.sp_GetVendorPortfolioAlbums.sql
    Description: Creates the [dbo].[sp_GetVendorPortfolioAlbums] stored procedure
    
    Execution Order: 70
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorPortfolioAlbums]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorPortfolioAlbums]'))
    DROP PROCEDURE [dbo].[sp_GetVendorPortfolioAlbums];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorPortfolioAlbums]
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

PRINT 'Stored procedure [dbo].[sp_GetVendorPortfolioAlbums] created successfully.';
GO
