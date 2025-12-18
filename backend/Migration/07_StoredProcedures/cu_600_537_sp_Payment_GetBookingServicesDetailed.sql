-- =============================================
-- Stored Procedure: sp_Payment_GetBookingServicesDetailed
-- Description: Gets booking services with detailed info
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingServicesDetailed]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingServicesDetailed];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingServicesDetailed]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT bs.BookingServiceID, bs.Quantity, bs.PriceAtBooking,
           s.Name AS ServiceName, s.Description AS ServiceDescription
    FROM BookingServices bs
    LEFT JOIN Services s ON bs.ServiceID = s.ServiceID
    WHERE bs.BookingID = @BookingID;
END
GO
