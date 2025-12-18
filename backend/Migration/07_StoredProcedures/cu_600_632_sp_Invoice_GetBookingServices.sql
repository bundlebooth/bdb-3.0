-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingServices
-- Description: Gets booking services for invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingServices]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingServices];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingServices]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.ServiceID, s.Name AS ServiceName, s.DurationMinutes
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;
END
GO
