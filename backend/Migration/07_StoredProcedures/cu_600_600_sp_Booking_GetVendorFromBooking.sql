-- =============================================
-- Stored Procedure: sp_Booking_GetVendorFromBooking
-- Description: Gets vendor profile ID from booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetVendorFromBooking]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetVendorFromBooking];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetVendorFromBooking]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM Bookings WHERE BookingID = @BookingID;
END
GO
