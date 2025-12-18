/*
    Migration Script: Create View [vw_UserFavorites]
    Phase: 400 - Views
    Script: cu_400_04_dbo.vw_UserFavorites.sql
    Description: Creates the [users].[vw_UserFavorites] view
    
    Execution Order: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [users].[vw_UserFavorites]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[users].[vw_UserFavorites]'))
    DROP VIEW [users].[vw_UserFavorites];
GO

CREATE VIEW [users].[vw_UserFavorites] AS
SELECT 
    f.FavoriteID,
    f.UserID,
    f.VendorProfileID,
    v.BusinessName AS VendorName,
    v.BusinessDescription,
    (SELECT STRING_AGG(vc.Category, ', ') FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder) AS PortfolioImage,
    f.CreatedAt
FROM users.Favorites f
JOIN vendors.VendorProfiles v ON f.VendorProfileID = v.VendorProfileID;
GO

PRINT 'View [users].[vw_UserFavorites] created successfully.';
GO
