/*
    Migration Script: Create Stored Procedure [sp_GetBookingDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_031_dbo.sp_GetBookingDetails.sql
    Description: Creates the [dbo].[sp_GetBookingDetails] stored procedure
    
    Execution Order: 31
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetBookingDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetBookingDetails]'))
    DROP PROCEDURE [dbo].[sp_GetBookingDetails];
GO

CREATE   PROCEDURE [dbo].[sp_GetBookingDetails]
    @BookingID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Booking info
    SELECT 
        b.BookingID,
        b.UserID,
        u.Name AS UserName,
        u.Email AS UserEmail,
        u.Phone AS UserPhone,
        b.VendorProfileID,
        v.BusinessName AS VendorName,
        v.BusinessEmail AS VendorEmail,
        v.BusinessPhone AS VendorPhone,
        b.EventDate,
        b.EndDate,
        b.EventLocation,
        b.EventName,
        b.EventType,
        b.TimeZone,
        b.Status,
        b.TotalAmount,
        b.DepositAmount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.AttendeeCount,
        b.SpecialRequests,
        b.StripePaymentIntentID,
        b.CreatedAt,
        b.UpdatedAt,
        CASE 
            WHEN b.UserID = @UserID THEN 1
            WHEN v.UserID = @UserID THEN 1
            ELSE 0
        END AS CanViewDetails
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    JOIN VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    WHERE b.BookingID = @BookingID
    AND (@UserID IS NULL OR b.UserID = @UserID OR v.UserID = @UserID);
    
    -- Booking services
    SELECT 
        bs.BookingServiceID,
        bs.ServiceID,
        s.Name AS ServiceName,
        s.DurationMinutes,
        bs.AddOnID,
        sa.Name AS AddOnName,
        bs.Quantity,
        bs.PriceAtBooking,
        bs.Notes,
        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS ServiceImage
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
    WHERE bs.BookingID = @BookingID;
    
    -- Booking timeline
    SELECT 
        bt.TimelineID,
        bt.Status,
        bt.ChangedBy,
        u.Name AS ChangedByName,
        bt.Notes,
        bt.CreatedAt
    FROM BookingTimeline bt
    LEFT JOIN Users u ON bt.ChangedBy = u.UserID
    WHERE bt.BookingID = @BookingID
    ORDER BY bt.CreatedAt DESC;
    
    -- Conversation info if exists
    SELECT TOP 1
        c.ConversationID
    FROM Conversations c
    WHERE c.BookingID = @BookingID;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetBookingDetails] created successfully.';
GO
