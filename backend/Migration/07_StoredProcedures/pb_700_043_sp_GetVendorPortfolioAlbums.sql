/*
    Migration Script: Create Stored Procedure [sp_GetVendorPortfolioAlbums]
    Phase: 600 - Stored Procedures
    Script: cu_600_070_dbo.sp_GetVendorPortfolioAlbums.sql
    Description: Creates the [vendors].[sp_GetPortfolioAlbums] stored procedure
    
    Execution Order: 70
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetPortfolioAlbums]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPortfolioAlbums]'))
    DROP PROCEDURE [vendors].[sp_GetPortfolioAlbums];
GO

CREATE   PROCEDURE [vendors].[sp_GetPortfolioAlbums]
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
        (SELECT COUNT(*) FROM vendors.VendorPortfolioImages WHERE AlbumID = a.AlbumID) AS ImageCount
    FROM VendorPortfolioAlbums a
    WHERE a.VendorProfileID = @VendorProfileID
    ORDER BY a.DisplayOrder, a.CreatedAt DESC;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetPortfolioAlbums] created successfully.';
GO

