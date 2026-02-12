-- =============================================
-- Stored Procedure: payments.sp_GetBookingEmailInfo
-- Description: Get booking info for sending payment-related emails
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingEmailInfo]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [payments].[sp_GetBookingEmailInfo]
GO

CREATE PROCEDURE [payments].[sp_GetBookingEmailInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Email, 
        u.FirstName, 
        u.LastName, 
        u.UserID, 
        v.BusinessName, 
        s.Name AS ServiceName, 
        b.TotalAmount
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    LEFT JOIN vendors.Services s ON b.ServiceID = s.ServiceID
    WHERE b.BookingID = @BookingID
END
GO
