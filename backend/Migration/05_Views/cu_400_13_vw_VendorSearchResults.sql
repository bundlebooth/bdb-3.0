/*
    Migration Script: Create View [vw_VendorSearchResults]
    Phase: 400 - Views
    Script: cu_400_13_dbo.vw_VendorSearchResults.sql
    Description: Creates the [vendors].[vw_VendorSearchResults] view
    
    Execution Order: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorSearchResults]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorSearchResults]'))
    DROP VIEW [vendors].[vw_VendorSearchResults];
GO

CREATE VIEW [vendors].[vw_VendorSearchResults] AS
SELECT 
    v.VendorProfileID AS id,
    v.BusinessName AS name,
    v.DisplayName, -- New field
    CONCAT(v.City, ', ', v.State) AS location,
    (SELECT TOP 1 vc.Category FROM vendors.VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
    v.PriceLevel,
    (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM vendors.Services s 
     JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID 
     WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
    CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
    ' (' + CAST(ISNULL((SELECT COUNT(*) FROM vendors.Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
    v.BusinessDescription AS description,
    ISNULL((SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
    CASE 
        WHEN v.IsPremium = 1 THEN 'Premium'
        WHEN (SELECT COUNT(*) FROM users.Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
        ELSE NULL
    END AS badge,
    v.Capacity,
    v.Rooms,
    v.IsPremium,
    v.IsEcoFriendly,
    v.IsAwardWinning,
    v.Latitude,
    v.Longitude,
    JSON_QUERY((
        SELECT 
            sc.Name AS category,
            JSON_QUERY((
                SELECT 
                    s.ServiceID,
                    s.Name AS name,
                    s.Description AS description,
                    '$' + CAST(s.Price AS NVARCHAR(20)) + 
                    CASE WHEN s.DurationMinutes IS NOT NULL 
                         THEN ' for ' + CAST(s.DurationMinutes/60 AS NVARCHAR(10)) + ' hours'
                         ELSE '' END AS price,
                    s.DurationMinutes,
                    s.MaxAttendees
                FROM vendors.Services s
                WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                FOR JSON PATH
            )) AS services
        FROM vendors.ServiceCategories sc
        WHERE sc.VendorProfileID = v.VendorProfileID
        FOR JSON PATH
    )) AS services
FROM vendors.VendorProfiles v
WHERE v.IsVerified = 1;
GO

PRINT 'View [vendors].[vw_VendorSearchResults] created successfully.';
GO
