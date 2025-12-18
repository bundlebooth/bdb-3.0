-- =============================================
-- Stored Procedure: sp_Booking_GetBookingInfo
-- Description: Gets booking info for invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetBookingInfo]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetBookingInfo];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetBookingInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.UserID AS ClientUserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
           b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid, b.StripePaymentIntentID,
           u.Name AS ClientName, u.Email AS ClientEmail, u.Phone AS ClientPhone,
           vp.BusinessName AS VendorName, vp.BusinessEmail AS VendorEmail, vp.BusinessPhone AS VendorPhone,
           vp.UserID AS VendorUserID
    FROM Bookings b
    JOIN Users u ON b.UserID = u.UserID
    JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
