-- =============================================
-- Stored Procedure: bookings.sp_GetVendorFromBooking
-- Description: Gets vendor profile ID from booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorFromBooking]'))
    DROP PROCEDURE [bookings].[sp_GetVendorFromBooking];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorFromBooking]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

