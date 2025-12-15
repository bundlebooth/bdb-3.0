/*
    Migration Script: Create View [vw_VendorSearchResults]
    Phase: 400 - Views
    Script: cu_400_13_dbo.vw_VendorSearchResults.sql
    Description: Creates the [dbo].[vw_VendorSearchResults] view
    
    Execution Order: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_VendorSearchResults]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_VendorSearchResults]'))
    DROP VIEW [dbo].[vw_VendorSearchResults];
GO

CREATE VIEW [dbo].[vw_VendorSearchResults] AS
SELECT 
    v.VendorProfileID AS id,
    v.BusinessName AS name,
    v.DisplayName, -- New field
    CONCAT(v.City, ', ', v.State) AS location,
    (SELECT TOP 1 vc.Category FROM VendorCategories vc WHERE vc.VendorProfileID = v.VendorProfileID) AS category,
    v.PriceLevel,
    (SELECT TOP 1 '$' + CAST(s.Price AS NVARCHAR(20)) FROM Services s 
     JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID 
     WHERE sc.VendorProfileID = v.VendorProfileID ORDER BY s.Price DESC) AS price,
    CAST(ISNULL((SELECT AVG(CAST(r.Rating AS DECIMAL(3,1))) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + 
    ' (' + CAST(ISNULL((SELECT COUNT(*) FROM Reviews r WHERE r.VendorProfileID = v.VendorProfileID AND r.IsApproved = 1), 0) AS NVARCHAR(10)) + ')' AS rating,
    v.BusinessDescription AS description,
    ISNULL((SELECT TOP 1 vi.ImageURL FROM VendorImages vi WHERE vi.VendorProfileID = v.VendorProfileID AND vi.IsPrimary = 1), '') AS image,
    CASE 
        WHEN v.IsPremium = 1 THEN 'Premium'
        WHEN (SELECT COUNT(*) FROM Favorites f WHERE f.VendorProfileID = v.VendorProfileID) > 20 THEN 'Popular'
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
                FROM Services s
                WHERE s.CategoryID = sc.CategoryID AND s.IsActive = 1
                FOR JSON PATH
            )) AS services
        FROM ServiceCategories sc
        WHERE sc.VendorProfileID = v.VendorProfileID
        FOR JSON PATH
    )) AS services
FROM VendorProfiles v
WHERE v.IsVerified = 1;
GO

PRINT 'View [dbo].[vw_VendorSearchResults] created successfully.';
GO
