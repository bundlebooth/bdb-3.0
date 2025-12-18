/*
    Migration Script: Create View [vw_VendorBookings]
    Phase: 400 - Views
    Script: cu_400_06_dbo.vw_VendorBookings.sql
    Description: Creates the [bookings].[vw_VendorBookings] view
    
    Execution Order: 6
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [bookings].[vw_VendorBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[bookings].[vw_VendorBookings]'))
    DROP VIEW [bookings].[vw_VendorBookings];
GO

CREATE VIEW [bookings].[vw_VendorBookings] AS
SELECT 
    b.BookingID,
    b.VendorProfileID,
    b.UserID,
    u.Name AS ClientName,
    u.Email AS ClientEmail,
    u.Phone AS ClientPhone,
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
    (SELECT COUNT(*) FROM messages.Messages m JOIN messages.Conversations c ON m.ConversationID = c.ConversationID 
      WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID = b.UserID) AS UnreadMessages,
    (SELECT TOP 1 r.Rating FROM vendors.Reviews r WHERE r.BookingID = b.BookingID) AS ReviewRating
FROM bookings.Bookings b
JOIN users.Users u ON b.UserID = u.UserID
JOIN vendors.Services s ON b.ServiceID = s.ServiceID
JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID;
GO

PRINT 'View [bookings].[vw_VendorBookings] created successfully.';
GO
