/*
    Migration Script: Create View [vendors].[vw_VendorSearchFallback]
    Description: Creates the [vendors].[vw_VendorSearchFallback] view
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorSearchFallback]'))
    DROP VIEW [vendors].[vw_VendorSearchFallback];
GO


    CREATE VIEW [vendors].[vw_VendorSearchFallback] AS
    SELECT
        v.VendorProfileID AS id,
        v.VendorProfileID,
        v.BusinessName AS name,
        v.DisplayName,
        (SELECT TOP 1 vc.Category FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS type,
        CONCAT(v.City, ' ', v.State) AS location,
        v.BusinessDescription AS description,
        v.PriceLevel AS priceLevel,
        (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS rating,
        (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
        (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
        (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
        v.LogoURL AS image,
        v.IsPremium,
        v.IsEcoFriendly,
        v.IsAwardWinning,
        v.IsLastMinute,
        (SELECT STRING_AGG(vc.Category, ', ') FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
        v.Address,
        v.City,
        v.State,
        v.Country,
        v.PostalCode,
        v.Latitude,
        v.Longitude,
        v.CreatedAt,
        v.IsVisible
    FROM vendors.VendorProfiles v
    WHERE v.IsVisible = 1;
  
GO
