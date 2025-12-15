/*
    Migration Script: Create View [vw_VendorReviews]
    Phase: 400 - Views
    Script: cu_400_12_dbo.vw_VendorReviews.sql
    Description: Creates the [dbo].[vw_VendorReviews] view
    
    Execution Order: 12
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_VendorReviews]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_VendorReviews]'))
    DROP VIEW [dbo].[vw_VendorReviews];
GO

CREATE VIEW [dbo].[vw_VendorReviews] AS
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
    (SELECT COUNT(*) FROM ReviewMedia rm WHERE rm.ReviewID = r.ReviewID) AS MediaCount,
    (SELECT TOP 1 s.Name FROM Bookings b JOIN Services s ON b.ServiceID = s.ServiceID WHERE b.BookingID = r.BookingID) AS ServiceName
FROM Reviews r
JOIN Users u ON r.UserID = u.UserID
WHERE r.IsApproved = 1;
GO

PRINT 'View [dbo].[vw_VendorReviews] created successfully.';
GO
