-- =============================================
-- Stored Procedure: payments.sp_GetBookingDisputeInfo
-- Description: Get booking info for dispute emails (both client and vendor)
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingDisputeInfo]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [payments].[sp_GetBookingDisputeInfo]
GO

CREATE PROCEDURE [payments].[sp_GetBookingDisputeInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Email AS ClientEmail, 
        u.FirstName, 
        u.LastName, 
        u.UserID AS ClientUserID,
        v.ContactEmail AS VendorEmail, 
        v.BusinessName, 
        vu.UserID AS VendorUserID,
        b.ServiceName
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles v ON b.VendorProfileID = v.VendorProfileID
    JOIN users.Users vu ON v.UserID = vu.UserID
    WHERE b.BookingID = @BookingID
END
GO
