-- =============================================
-- View: vw_VendorSearchFallback
-- Description: Fallback view for vendor search
-- Phase: 400 (Views)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_VendorSearchFallback]'))
    DROP VIEW [dbo].[vw_VendorSearchFallback];
GO

CREATE VIEW [dbo].[vw_VendorSearchFallback] AS
SELECT 
    v.VendorProfileID AS id,
    v.VendorProfileID,
    v.BusinessName AS name,
    v.DisplayName,
    (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS type,
    CONCAT(v.City, ' ', v.State) AS location,
    v.BusinessDescription AS description,
    v.PriceLevel AS priceLevel,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS rating,
    (SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
    (SELECT COUNT(*) FROM Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
    v.LogoURL AS image,
    v.Capacity,
    v.Rooms,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.IsLastMinute,
    (SELECT STRING_AGG(vc.Category, ', ') FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    v.Address,
    v.City,
    v.State,
    v.Country,
    v.PostalCode,
    v.Latitude,
    v.Longitude,
    v.CreatedAt,
    v.IsVisible
FROM VendorProfiles v
WHERE v.IsVisible = 1;
GO
