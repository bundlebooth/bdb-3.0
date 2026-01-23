-- =============================================
-- Stored Procedure: bookings.sp_GetBookingClientVendor
-- Description: Gets client and vendor IDs from booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingClientVendor]'))
    DROP PROCEDURE [bookings].[sp_GetBookingClientVendor];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingClientVendor]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID AS ClientUserID, VendorProfileID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

