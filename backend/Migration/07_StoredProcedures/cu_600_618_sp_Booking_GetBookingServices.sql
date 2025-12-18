-- =============================================
-- Stored Procedure: sp_Booking_GetBookingServices
-- Description: Gets services for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetBookingServices]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetBookingServices];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.ServiceID, s.Name AS ServiceName,
           bs.AddOnID, sa.Name AS AddOnName, bs.Quantity, bs.PriceAtBooking
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    LEFT JOIN ServiceAddOns sa ON bs.AddOnID = sa.AddOnID
    WHERE bs.BookingID = @BookingID;
END
GO
