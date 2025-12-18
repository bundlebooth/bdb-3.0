-- =============================================
-- Stored Procedure: bookings.sp_GetBookingServices
-- Description: Gets services for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingServices]'))
    DROP PROCEDURE [bookings].[sp_GetBookingServices];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.ServiceID, s.Name AS ServiceName,
           bs.AddOnID, sa.Name AS AddOnName, bs.Quantity, bs.PriceAtBooking
    FROM bookings.BookingServices bs
    LEFT JOIN vendors.Services s ON bs.ServiceID = s.ServiceID
    LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
    WHERE bs.BookingID = @BookingID;
END
GO

