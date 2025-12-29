-- =============================================
-- Stored Procedure: bookings.sp_InsertBookingService
-- Description: Inserts a booking service record
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertBookingService]'))
    DROP PROCEDURE [bookings].[sp_InsertBookingService];
GO

CREATE PROCEDURE [bookings].[sp_InsertBookingService]
    @BookingID INT,
    @ServiceID INT = NULL,
    @Quantity INT = 1,
    @PriceAtBooking DECIMAL(10,2),
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO bookings.BookingServices (BookingID, ServiceID, Quantity, PriceAtBooking, Notes)
    OUTPUT INSERTED.BookingServiceID
    VALUES (@BookingID, @ServiceID, @Quantity, @PriceAtBooking, @Notes);
END
GO
