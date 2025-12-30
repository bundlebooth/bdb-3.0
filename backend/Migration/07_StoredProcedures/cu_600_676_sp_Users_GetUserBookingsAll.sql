/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_676_sp_Users_GetUserBookingsAll.sql
    Description: Creates the [users].[sp_GetUserBookingsAll] stored procedure
                 Used by GET /api/users/:id/bookings/all endpoint
    
    Execution Order: 676
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUserBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserBookingsAll]'))
    DROP PROCEDURE [users].[sp_GetUserBookingsAll];
GO

CREATE PROCEDURE [users].[sp_GetUserBookingsAll]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get confirmed bookings from Bookings table
    SELECT 
        b.BookingID,
        NULL AS RequestID,
        b.UserID,
        b.VendorProfileID,
        b.ServiceID,
        b.BookingDate,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.CancellationDate,
        b.RefundAmount,
        b.StripePaymentIntentID,
        b.CreatedAt,
        b.UpdatedAt,
        b.EventLocation,
        b.EventName,
        b.EventType,
        b.TimeZone,
        vp.BusinessName AS VendorName,
        vp.BusinessEmail AS VendorEmail,
        vp.BusinessPhone AS VendorPhone,
        vp.LogoURL AS VendorLogo,
        b.EventLocation AS Location,
        (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.UserID = b.UserID AND c.VendorProfileID = b.VendorProfileID) AS ConversationID,
        COALESCE(
            (SELECT TOP 1 s.Name FROM bookings.BookingServices bs 
             INNER JOIN vendors.Services s ON bs.ServiceID = s.ServiceID 
             WHERE bs.BookingID = b.BookingID ORDER BY bs.BookingServiceID),
            (SELECT Name FROM vendors.Services WHERE ServiceID = b.ServiceID),
            'Service'
        ) AS ServiceName,
        'booking' AS RecordType
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.UserID = @UserID

    UNION ALL

    -- Get approved requests from BookingRequests table (awaiting payment)
    -- Exclude requests that already have a corresponding booking created
    SELECT 
        NULL AS BookingID,
        br.RequestID,
        br.UserID,
        br.VendorProfileID,
        br.ServiceID,
        br.CreatedAt AS BookingDate,
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
        NULL AS CancellationDate,
        NULL AS RefundAmount,
        br.PaymentIntentID AS StripePaymentIntentID,
        br.CreatedAt,
        NULL AS UpdatedAt,
        br.EventLocation,
        br.EventName,
        br.EventType,
        br.TimeZone,
        vp.BusinessName AS VendorName,
        vp.BusinessEmail AS VendorEmail,
        vp.BusinessPhone AS VendorPhone,
        vp.LogoURL AS VendorLogo,
        br.EventLocation AS Location,
        (SELECT TOP 1 c.ConversationID FROM messages.Conversations c WHERE c.UserID = br.UserID AND c.VendorProfileID = br.VendorProfileID) AS ConversationID,
        COALESCE(
            (SELECT TOP 1 JSON_VALUE(br.Services, '$[0].name')),
            'Service'
        ) AS ServiceName,
        'request' AS RecordType
    FROM bookings.BookingRequests br
    INNER JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    WHERE br.UserID = @UserID
      AND br.Status = 'approved'
      AND NOT EXISTS (
          SELECT 1 FROM bookings.Bookings b 
          WHERE b.UserID = br.UserID 
            AND b.VendorProfileID = br.VendorProfileID 
            AND b.EventDate = br.EventDate
            AND b.Status = 'confirmed'
      )

    ORDER BY EventDate DESC;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserBookingsAll] created successfully.';
GO
