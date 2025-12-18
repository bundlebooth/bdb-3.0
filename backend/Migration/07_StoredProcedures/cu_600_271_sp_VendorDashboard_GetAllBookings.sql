-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetAllBookings
-- Description: Gets all bookings for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetAllBookings]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetAllBookings];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetAllBookings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.VendorProfileID,
        b.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.Phone AS ClientPhone,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.EventLocation AS Location,
        b.EventName,
        b.EventType,
        b.TimeZone,
        b.CreatedAt,
        b.UpdatedAt,
        (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.UserID = b.UserID AND c.VendorProfileID = b.VendorProfileID) AS ConversationID,
        COALESCE(
            (SELECT TOP 1 s.Name FROM bookings.BookingServices bs 
             INNER JOIN vendors.Services s ON bs.ServiceID = s.ServiceID 
             WHERE bs.BookingID = b.BookingID ORDER BY bs.BookingServiceID),
            'Service'
        ) AS ServiceName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    WHERE b.VendorProfileID = @VendorProfileID
    ORDER BY b.EventDate DESC;
END
GO





