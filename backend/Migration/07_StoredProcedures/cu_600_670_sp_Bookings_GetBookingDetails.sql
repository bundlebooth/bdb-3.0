/*
    Migration Script: Create Stored Procedure [bookings].[sp_GetBookingDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_670_sp_Bookings_GetBookingDetails.sql
    Description: Creates the [bookings].[sp_GetBookingDetails] stored procedure
                 Used by GET /api/bookings/:id endpoint
    
    Execution Order: 670
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_GetBookingDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingDetails]'))
    DROP PROCEDURE [bookings].[sp_GetBookingDetails];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingDetails]
    @BookingID INT,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @VendorUserID INT;
    DECLARE @BookingUserID INT;
    DECLARE @VendorProfileID INT;

    -- Get booking info
    SELECT @BookingUserID = UserID, @VendorProfileID = VendorProfileID
    FROM bookings.Bookings WHERE BookingID = @BookingID;

    -- Get vendor's user ID
    SELECT @VendorUserID = UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;

    -- Check access
    DECLARE @CanView BIT = 0;
    IF @UserID IS NULL OR @UserID = @BookingUserID OR @UserID = @VendorUserID
        SET @CanView = 1;

    -- Booking info with access flag
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.EventDate,
        b.EndDate,
        b.AttendeeCount,
        b.SpecialRequests,
        b.Status,
        b.TotalAmount,
        b.CreatedAt,
        b.UpdatedAt,
        vp.BusinessName AS VendorName,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        @CanView AS CanViewDetails
    FROM bookings.Bookings b
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    WHERE b.BookingID = @BookingID;

    -- Services for this booking
    SELECT bs.*, s.Name AS ServiceName, s.Description AS ServiceDescription
    FROM bookings.BookingServices bs
    LEFT JOIN vendors.Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;

    -- Empty timeline placeholder
    SELECT NULL AS StatusHistoryID, @BookingID AS BookingID, NULL AS OldStatus, NULL AS NewStatus, NULL AS ChangedAt WHERE 1=0;

    -- Conversation ID
    SELECT ConversationID FROM messages.Conversations 
    WHERE UserID = @BookingUserID AND VendorProfileID = @VendorProfileID;
END;

GO

PRINT 'Stored procedure [bookings].[sp_GetBookingDetails] created successfully.';
GO
