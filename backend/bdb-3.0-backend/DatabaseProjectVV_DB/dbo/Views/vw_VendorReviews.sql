
-- Vendor reviews view
CREATE   VIEW vw_VendorReviews AS
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

