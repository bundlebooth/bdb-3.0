-- =============================================
-- Stored Procedure: payments.sp_GetBookingServicesDetailed
-- Description: Gets booking services with detailed info
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingServicesDetailed]'))
    DROP PROCEDURE [payments].[sp_GetBookingServicesDetailed];
GO

CREATE PROCEDURE [payments].[sp_GetBookingServicesDetailed]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.Name AS ServiceName, s.Description AS ServiceDescription
    FROM bookings.BookingServices bs
    LEFT JOIN vendors.Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;
END
GO

