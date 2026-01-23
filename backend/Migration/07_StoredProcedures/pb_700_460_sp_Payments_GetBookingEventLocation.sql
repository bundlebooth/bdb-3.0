-- =============================================
-- Payments - Get Booking Event Location
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('payments.sp_GetBookingEventLocation', 'P') IS NOT NULL
    DROP PROCEDURE payments.sp_GetBookingEventLocation;
GO

CREATE PROCEDURE payments.sp_GetBookingEventLocation
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT EventLocation 
    FROM bookings.Bookings 
    WHERE BookingID = @BookingID;
END
GO
