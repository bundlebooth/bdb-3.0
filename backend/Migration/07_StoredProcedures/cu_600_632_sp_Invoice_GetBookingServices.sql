-- =============================================
-- Stored Procedure: invoices.sp_GetBookingServices
-- Description: Gets booking services for invoice
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingServices]'))
    DROP PROCEDURE [invoices].[sp_GetBookingServices];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.ServiceID, s.Name AS ServiceName, s.DurationMinutes
    FROM bookings.BookingServices bs
    LEFT JOIN vendors.Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;
END
GO

