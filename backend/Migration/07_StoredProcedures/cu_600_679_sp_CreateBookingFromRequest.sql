/*
    Migration Script: Create Stored Procedure [bookings].[sp_CreateBookingFromRequest]
    Phase: 600 - Stored Procedures
    Script: cu_600_679_sp_CreateBookingFromRequest.sql
    Description: Creates a confirmed booking from an approved request after payment
                 Links the booking back to the original request via RequestID FK
    
    Execution Order: 679
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_CreateBookingFromRequest]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CreateBookingFromRequest]'))
    DROP PROCEDURE [bookings].[sp_CreateBookingFromRequest];
GO

CREATE PROCEDURE [bookings].[sp_CreateBookingFromRequest]
    @RequestID INT,
    @PaymentIntentID NVARCHAR(100) = NULL,
    @TotalAmount DECIMAL(10,2) = NULL,
    @DepositAmount DECIMAL(10,2) = NULL,
    @DepositPaid BIT = 0,
    @FullAmountPaid BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BookingID INT;
    DECLARE @UserID INT;
    DECLARE @VendorProfileID INT;
    DECLARE @ServiceID INT;
    DECLARE @EventDate DATETIME;
    DECLARE @EventLocation NVARCHAR(500);
    DECLARE @EventName NVARCHAR(255);
    DECLARE @EventType NVARCHAR(100);
    DECLARE @TimeZone NVARCHAR(100);
    DECLARE @AttendeeCount INT;
    DECLARE @SpecialRequests NVARCHAR(MAX);
    DECLARE @Budget DECIMAL(10,2);
    
    -- Check if booking already exists for this request
    IF EXISTS (SELECT 1 FROM bookings.Bookings WHERE RequestID = @RequestID)
    BEGIN
        SELECT BookingID FROM bookings.Bookings WHERE RequestID = @RequestID;
        RETURN;
    END
    
    -- Get request details
    SELECT 
        @UserID = UserID,
        @VendorProfileID = VendorProfileID,
        @ServiceID = ServiceID,
        @EventDate = EventDate,
        @EventLocation = EventLocation,
        @EventName = EventName,
        @EventType = EventType,
        @TimeZone = TimeZone,
        @AttendeeCount = AttendeeCount,
        @SpecialRequests = SpecialRequests,
        @Budget = COALESCE(ProposedPrice, Budget)
    FROM bookings.BookingRequests
    WHERE RequestID = @RequestID
      AND Status IN ('approved', 'accepted', 'confirmed');
    
    IF @UserID IS NULL
    BEGIN
        RAISERROR('Request not found or not in approved status', 16, 1);
        RETURN;
    END
    
    -- Use provided amount or fall back to budget
    SET @TotalAmount = COALESCE(@TotalAmount, @Budget, 0);
    
    -- Create the booking with RequestID link
    INSERT INTO bookings.Bookings (
        RequestID,
        UserID,
        VendorProfileID,
        ServiceID,
        BookingDate,
        EventDate,
        Status,
        TotalAmount,
        DepositAmount,
        DepositPaid,
        FullAmountPaid,
        AttendeeCount,
        SpecialRequests,
        EventLocation,
        EventName,
        EventType,
        TimeZone,
        StripePaymentIntentID,
        CreatedAt,
        UpdatedAt
    )
    VALUES (
        @RequestID,
        @UserID,
        @VendorProfileID,
        @ServiceID,
        GETDATE(),
        @EventDate,
        CASE WHEN @FullAmountPaid = 1 THEN 'paid' ELSE 'confirmed' END,
        @TotalAmount,
        @DepositAmount,
        @DepositPaid,
        @FullAmountPaid,
        @AttendeeCount,
        @SpecialRequests,
        @EventLocation,
        @EventName,
        @EventType,
        @TimeZone,
        @PaymentIntentID,
        GETDATE(),
        GETDATE()
    );
    
    SET @BookingID = SCOPE_IDENTITY();
    
    -- Update the request status to reflect it's been converted
    UPDATE bookings.BookingRequests
    SET Status = 'paid',
        ConfirmedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE RequestID = @RequestID;
    
    -- Return the new booking ID
    SELECT @BookingID AS BookingID;
END;
GO

PRINT 'Stored procedure [bookings].[sp_CreateBookingFromRequest] created successfully.';
GO
