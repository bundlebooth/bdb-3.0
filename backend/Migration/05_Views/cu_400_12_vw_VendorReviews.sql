/*
    Migration Script: Create View [vw_VendorReviews]
    Phase: 400 - Views
    Script: cu_400_12_dbo.vw_VendorReviews.sql
    Description: Creates the [vendors].[vw_VendorReviews] view
    
    Execution Order: 12
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorReviews]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorReviews]'))
    DROP VIEW [vendors].[vw_VendorReviews];
GO

CREATE VIEW [vendors].[vw_VendorReviews] AS
SELECT 
    r.ReviewID,
    r.VendorProfileID,
    r.UserID,
    u.Name AS ReviewerName,
    u.ProfileImageURL AS ReviewerAvatar,
    r.BookingID,
    r.Rating,
    r.Title,
    r.Comment,
    r.Response,
    r.ResponseDate,
    r.IsAnonymous,
    r.IsFeatured,
    r.CreatedAt,
    (SELECT COUNT(*) FROM vendors.ReviewMedia rm WHERE rm.ReviewID = r.ReviewID) AS MediaCount,
    (SELECT TOP 1 s.Name FROM bookings.Bookings b JOIN vendors.Services s ON b.ServiceID = s.ServiceID WHERE b.BookingID = r.BookingID) AS ServiceName
FROM vendors.Reviews r
JOIN users.Users u ON r.UserID = u.UserID
WHERE r.IsApproved = 1;
GO

PRINT 'View [vendors].[vw_VendorReviews] created successfully.';
GO
