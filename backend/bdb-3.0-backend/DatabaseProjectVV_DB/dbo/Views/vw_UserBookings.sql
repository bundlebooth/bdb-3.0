
-- User bookings view
CREATE   VIEW vw_UserBookings AS
SELECT 
    b.BookingID,
    b.UserID,
    b.VendorProfileID,
    vp.BusinessName AS VendorName,
    b.ServiceID,
    s.Name AS ServiceName,
    sc.Name AS ServiceCategory,
    b.EventDate,
    b.EndDate,
    b.Status,
    b.TotalAmount,
    b.DepositAmount,
    b.DepositPaid,
    b.FullAmountPaid,
    b.AttendeeCount,
    b.SpecialRequests,
    b.EventLocation,
    b.EventName,
    b.EventType,
    b.TimeZone,
    b.CreatedAt,
    b.UpdatedAt,
    (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage,
    (SELECT TOP 1 c.ConversationID FROM Conversations c WHERE c.BookingID = b.BookingID) AS ConversationID,
    (SELECT COUNT(*) FROM Messages m JOIN Conversations c ON m.ConversationID = c.ConversationID 
      WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID != b.UserID) AS UnreadMessages
FROM Bookings b
JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
JOIN Services s ON b.ServiceID = s.ServiceID
JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID;

GO

