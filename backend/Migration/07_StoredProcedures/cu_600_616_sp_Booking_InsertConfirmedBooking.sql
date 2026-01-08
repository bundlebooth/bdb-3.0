-- =============================================
-- Stored Procedure: bookings.sp_InsertConfirmedBooking
-- Description: Creates a confirmed booking from request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertConfirmedBooking]'))
    DROP PROCEDURE [bookings].[sp_InsertConfirmedBooking];
GO

CREATE PROCEDURE [bookings].[sp_InsertConfirmedBooking]
    @UserID INT,
    @VendorProfileID INT,
    @ServiceID INT,
    @EventDate DATETIME,
    @EndDate DATETIME = NULL,
    @TotalAmount DECIMAL(10,2),
    @AttendeeCount INT = 1,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @EventLocation NVARCHAR(500) = NULL,
    @EventName NVARCHAR(255) = NULL,
    @EventType NVARCHAR(100) = NULL,
    @TimeZone NVARCHAR(100) = NULL,
    @StripePaymentIntentID NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO bookings.Bookings (
        UserID, VendorProfileID, ServiceID, EventDate, EndDate, Status, 
        AttendeeCount, SpecialRequests, TotalAmount, EventLocation, 
        EventName, EventType, TimeZone, StripePaymentIntentID, FullAmountPaid
    )
    OUTPUT INSERTED.BookingID
    VALUES (
        @UserID, @VendorProfileID, @ServiceID, @EventDate, @EndDate, 'confirmed', 
        @AttendeeCount, @SpecialRequests, @TotalAmount, @EventLocation,
        @EventName, @EventType, @TimeZone, @StripePaymentIntentID, 1
    );
END
GO

