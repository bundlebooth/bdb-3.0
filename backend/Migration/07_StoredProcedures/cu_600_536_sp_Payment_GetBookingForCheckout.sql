-- =============================================
-- Stored Procedure: payments.sp_GetBookingForCheckout
-- Description: Gets booking details for checkout session
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingForCheckout]'))
    DROP PROCEDURE [payments].[sp_GetBookingForCheckout];
GO

CREATE PROCEDURE [payments].[sp_GetBookingForCheckout]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.FullAmountPaid, b.TotalAmount, b.EventDate, b.EventName, b.EventType, b.EventLocation,
           b.UserID, b.VendorProfileID, b.ServiceID,
           u.Name AS ClientName, u.Email AS ClientEmail, u.Phone AS ClientPhone,
           vp.BusinessName AS VendorName, vp.StripeAccountID
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



