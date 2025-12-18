-- =============================================
-- Stored Procedure: sp_Booking_GetBookingClientVendor
-- Description: Gets client and vendor IDs from booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetBookingClientVendor]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetBookingClientVendor];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetBookingClientVendor]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID AS ClientUserID, VendorProfileID FROM Bookings WHERE BookingID = @BookingID;
END
GO
