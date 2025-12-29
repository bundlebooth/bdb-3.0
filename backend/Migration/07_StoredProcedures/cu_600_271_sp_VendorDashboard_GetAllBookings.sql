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
    
    -- Get confirmed bookings from Bookings table
    SELECT 
        b.BookingID,
        NULL AS RequestID,
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
        ) AS ServiceName,
        'booking' AS RecordType
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    WHERE b.VendorProfileID = @VendorProfileID

    UNION ALL

    -- Get pending requests from BookingRequests table
    SELECT 
        NULL AS BookingID,
        br.RequestID,
        br.VendorProfileID,
        br.UserID,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        u.Phone AS ClientPhone,
        br.EventDate,
        NULL AS EndDate,
        br.Status,
        COALESCE(
            br.Budget,
            TRY_CAST(JSON_VALUE(br.Services, '$[0].price') AS DECIMAL(10,2)),
            0
        ) AS TotalAmount,
        NULL AS DepositAmount,
        0 AS DepositPaid,
        0 AS FullAmountPaid,
        br.AttendeeCount,
        br.SpecialRequests,
        br.EventLocation AS Location,
        br.EventName,
        br.EventType,
        br.TimeZone,
        br.CreatedAt,
        NULL AS UpdatedAt,
        (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.UserID = br.UserID AND c.VendorProfileID = br.VendorProfileID) AS ConversationID,
        COALESCE(
            (SELECT TOP 1 JSON_VALUE(br.Services, '$[0].name')),
            'Service'
        ) AS ServiceName,
        'request' AS RecordType
    FROM bookings.BookingRequests br
    LEFT JOIN users.Users u ON br.UserID = u.UserID
    WHERE br.VendorProfileID = @VendorProfileID
      AND br.Status IN ('pending', 'counter_offer')

    ORDER BY EventDate DESC;
END
GO





