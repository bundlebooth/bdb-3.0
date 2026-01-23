-- =============================================
-- Payments - Create Booking From Request
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('payments.sp_CreateBookingFromRequest', 'P') IS NOT NULL
    DROP PROCEDURE payments.sp_CreateBookingFromRequest;
GO

CREATE PROCEDURE payments.sp_CreateBookingFromRequest
    @UserID INT,
    @VendorProfileID INT,
    @ServiceID INT,
    @EventDate DATETIME,
    @TotalAmount DECIMAL(10,2),
    @AttendeeCount INT,
    @SpecialRequests NVARCHAR(MAX),
    @EventLocation NVARCHAR(500),
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO bookings.Bookings (UserID, VendorProfileID, ServiceID, EventDate, Status, AttendeeCount, SpecialRequests, TotalAmount, EventLocation, StripePaymentIntentID, FullAmountPaid, CreatedAt)
    OUTPUT INSERTED.BookingID
    VALUES (@UserID, @VendorProfileID, @ServiceID, @EventDate, 'confirmed', @AttendeeCount, @SpecialRequests, @TotalAmount, @EventLocation, @StripePaymentIntentID, 1, GETDATE());
END
GO
