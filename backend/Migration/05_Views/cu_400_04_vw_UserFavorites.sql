/*
    Migration Script: Create View [vw_UserFavorites]
    Phase: 400 - Views
    Script: cu_400_04_dbo.vw_UserFavorites.sql
    Description: Creates the [dbo].[vw_UserFavorites] view
    
    Execution Order: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_UserFavorites]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_UserFavorites]'))
    DROP VIEW [dbo].[vw_UserFavorites];
GO

CREATE VIEW [dbo].[vw_UserFavorites] AS
SELECT 
    f.FavoriteID,
    f.UserID,
    f.VendorProfileID,
    v.BusinessName AS VendorName,
    v.BusinessDescription,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT TOP 1 p.ImageURL FROM VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder) AS PortfolioImage,
    f.CreatedAt
FROM Favorites f
JOIN VendorProfiles v ON f.VendorProfileID = v.VendorProfileID;
GO

PRINT 'View [dbo].[vw_UserFavorites] created successfully.';
GO
