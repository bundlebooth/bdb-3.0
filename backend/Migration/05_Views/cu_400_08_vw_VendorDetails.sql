/*
    Migration Script: Create View [vw_VendorDetails]
    Phase: 400 - Views
    Script: cu_400_08_dbo.vw_VendorDetails.sql
    Description: Creates the [vendors].[vw_VendorDetails] view
    
    Execution Order: 8
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorDetails]'))
    DROP VIEW [vendors].[vw_VendorDetails];
GO

CREATE VIEW [vendors].[vw_VendorDetails] AS
SELECT 
    v.VendorProfileID,
    v.UserID,
    u.Name AS OwnerName,
    u.Email AS OwnerEmail,
    u.Phone AS OwnerPhone,
    v.BusinessName,
    v.DisplayName,
    v.Tagline,
    v.BusinessDescription,
    v.BusinessPhone,
    v.BusinessEmail,
    v.Website,
    v.YearsInBusiness,
    v.LicenseNumber,
    v.InsuranceVerified,
    v.IsVerified,
    v.IsCompleted,
    v.AverageResponseTime,
    v.ResponseRate,
    v.Address,
    v.City,
    v.State,
    v.Country,
    v.PostalCode,
    v.Latitude,
    v.Longitude,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.PriceLevel,
    v.Capacity,
    v.Rooms,
    v.LogoURL,
    v.BookingLink,
    v.AcceptingBookings,
    (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID) AS FavoriteCount,
    (SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS AverageRating,
    (SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1) AS ReviewCount,
    (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.VendorProfileID = v.VendorProfileID) AS BookingCount,
    (SELECT STRING_AGG(vc.Category, ', ') FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS Categories,
    (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1) AS PrimaryImage
FROM vendors.VendorProfiles v
JOIN users.Users u ON v.UserID = u.UserID
WHERE u.IsActive = 1;
GO

PRINT 'View [vendors].[vw_VendorDetails] created successfully.';
GO
