/*
    Migration Script: Create View [vw_UserBookings]
    Phase: 400 - Views
    Script: cu_400_02_dbo.vw_UserBookings.sql
    Description: Creates the [bookings].[vw_UserBookings] view
    
    Execution Order: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [bookings].[vw_UserBookings]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[bookings].[vw_UserBookings]'))
    DROP VIEW [bookings].[vw_UserBookings];
GO

CREATE VIEW [bookings].[vw_UserBookings] AS
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
    (SELECT TOP 1 si.ImageURL FROM vendors.ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage,
    (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.BookingID = b.BookingID) AS ConversationID,
    (SELECT COUNT(*) FROM messages.Messages m JOIN messages.Conversations c ON m.ConversationID = c.ConversationID 
      WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID != b.UserID) AS UnreadMessages
FROM bookings.Bookings b
JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
JOIN vendors.Services s ON b.ServiceID = s.ServiceID
JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID;
GO

PRINT 'View [bookings].[vw_UserBookings] created successfully.';
GO
