/*
    Migration Script: Create View [bookings].[vw_UserBookings]
    Description: Creates the [bookings].[vw_UserBookings] view
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[bookings].[vw_UserBookings]'))
    DROP VIEW [bookings].[vw_UserBookings];
GO


    CREATE VIEW [bookings].[vw_UserBookings] AS
    SELECT
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.ServiceID,
        vp.BusinessName AS VendorName,
        vp.DisplayName AS VendorDisplayName,
        vp.LogoURL AS VendorLogo,
        s.Name AS ServiceName,
        sc.Name AS CategoryName,
        b.EventDate,
        b.EventTime AS StartTime,
        b.EventEndTime AS EndTime,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.CreatedAt,
        b.UpdatedAt,
        b.CancelledAt,
        b.CancellationReason,
        (SELECT TOP 1 vi.ImageURL FROM vendors.VendorImages vi WHERE vi.VendorProfileID = vp.VendorProfileID AND vi.IsPrimary = 1) AS ServiceImage,
        (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.BookingID = b.BookingID) AS ConversationID,
        (SELECT COUNT(*) FROM messages.Messages m JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
          WHERE c.BookingID = b.BookingID AND m.IsRead = 0 AND m.SenderID != b.UserID) AS UnreadMessages
    FROM bookings.Bookings b
    JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID;
  
GO
