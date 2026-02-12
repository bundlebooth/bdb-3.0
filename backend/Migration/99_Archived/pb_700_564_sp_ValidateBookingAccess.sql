-- =============================================
-- Stored Procedure: bookings.sp_ValidateBookingAccess
-- Description: Get booking details for access validation
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[sp_ValidateBookingAccess]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [bookings].[sp_ValidateBookingAccess]
GO

CREATE PROCEDURE [bookings].[sp_ValidateBookingAccess]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.Status,
        b.EventDate,
        b.CreatedAt,
        b.CancelledAt,
        vp.UserID AS VendorUserID
    FROM bookings.Bookings b
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID
END
GO
