-- =============================================
-- Stored Procedure: payments.sp_GetBookingUserVendor
-- Description: Gets user and vendor IDs from booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingUserVendor]'))
    DROP PROCEDURE [payments].[sp_GetBookingUserVendor];
GO

CREATE PROCEDURE [payments].[sp_GetBookingUserVendor]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID, VendorProfileID, TotalAmount FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

