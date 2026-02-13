/*
    Migration Script: Update View [vendors].[vw_VendorSearchResults] to include badges
    Description: Adds ActiveBadges column to vendor search results
    
    Created: 2026-02-12
*/

SET NOCOUNT ON;
GO

-- Drop and recreate the view with badges
IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorSearchResults]'))
    DROP VIEW [vendors].[vw_VendorSearchResults];
GO

CREATE VIEW [vendors].[vw_VendorSearchResults] AS
SELECT
    v.VendorProfileID AS id,
    v.VendorProfileID,
    v.BusinessName AS name,
    v.BusinessName,
    v.DisplayName,
    CONCAT(v.City, ', ', v.State) AS location,
    v.City,
    v.State,
    v.Country,
    (SELECT TOP 1 vc.Category FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
    v.PriceLevel,
    (SELECT MIN(s.Price) FROM vendors.Services s WHERE s.VendorProfileID = v.VendorProfileID AND s.IsActive = 1) AS MinPrice,
    COALESCE(v.AvgRating, (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)) AS averageRating,
    COALESCE(v.TotalReviews, (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1)) AS totalReviews,
    v.BusinessDescription AS description,
    COALESCE(
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1),
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID ORDER BY vi.ImageID),
        (SELECT TOP 1 p.ImageURL FROM vendors.VendorPortfolio p WHERE p.VendorProfileID = v.VendorProfileID ORDER BY p.DisplayOrder)
    ) AS FeaturedImageURL,
    v.LogoURL,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.IsGuestFavorite,
    v.Latitude,
    v.Longitude,
    v.ResponseRate,
    v.AvgResponseTimeMinutes,
    -- Active badges as comma-separated string
    (
        SELECT STRING_AGG(b.BadgeKey, ',') 
        FROM vendors.VendorBadgeGrants bg
        JOIN vendors.VendorBadges b ON bg.BadgeID = b.BadgeID
        WHERE bg.VendorProfileID = v.VendorProfileID 
          AND bg.IsActive = 1 
          AND b.IsActive = 1
          AND (bg.ExpiresAt IS NULL OR bg.ExpiresAt > GETDATE())
    ) AS ActiveBadges
FROM vendors.VendorProfiles v
WHERE v.IsVisible = 1 AND v.ApprovalStatus = 'Approved';
GO

PRINT 'Updated view: [vendors].[vw_VendorSearchResults] with ActiveBadges column';
GO
