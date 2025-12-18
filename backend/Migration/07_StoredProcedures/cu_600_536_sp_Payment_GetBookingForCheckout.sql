-- =============================================
-- Stored Procedure: sp_Payment_GetBookingForCheckout
-- Description: Gets booking details for checkout session
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingForCheckout]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingForCheckout];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingForCheckout]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.FullAmountPaid, b.TotalAmount, b.EventDate, b.EventName, b.EventType, b.EventLocation,
           b.UserID, b.VendorProfileID, b.ServiceID,
           u.Name AS ClientName, u.Email AS ClientEmail, u.Phone AS ClientPhone,
           vp.BusinessName AS VendorName, vp.StripeAccountID
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
