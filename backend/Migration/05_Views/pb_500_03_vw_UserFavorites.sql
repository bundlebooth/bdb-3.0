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
    v.BusinessName,
    v.BusinessName AS VendorName,
    v.BusinessDescription,
    v.City,
    v.State,
    v.Country,
    v.LogoURL,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    COALESCE(v.AvgRating, (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)) AS averageRating,
    COALESCE(v.TotalReviews, (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)) AS totalReviews,
    COALESCE(
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.ImageURL NOT LIKE '%placehold%' ORDER BY vi.ImageID),
        (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID AND p.ImageURL NOT LIKE '%placehold%' ORDER BY p.DisplayOrder),
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID ORDER BY vi.ImageID),
        (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder)
    ) AS FeaturedImageURL,
    COALESCE(
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.ImageURL NOT LIKE '%placehold%' ORDER BY vi.ImageID),
        (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID AND p.ImageURL NOT LIKE '%placehold%' ORDER BY p.DisplayOrder),
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID ORDER BY vi.ImageID),
        (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder)
    ) AS PortfolioImage,
    (SELECT MIN(s.Price) FROM vendors.Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1) AS MinPrice,
    f.CreatedAt
FROM users.Favorites f
JOIN vendors.VendorProfiles v ON f.VendorProfileID = v.VendorProfileID
WHERE v.IsVisible = 1;
GO

PRINT 'View [users].[vw_UserFavorites] created successfully.';
GO
