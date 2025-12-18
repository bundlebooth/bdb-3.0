-- =============================================
-- Stored Procedure: bookings.sp_GetPaymentIntentID
-- Description: Gets the Stripe PaymentIntentID for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetPaymentIntentID]'))
    DROP PROCEDURE [bookings].[sp_GetPaymentIntentID];
GO

CREATE PROCEDURE [bookings].[sp_GetPaymentIntentID]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 StripePaymentIntentID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

