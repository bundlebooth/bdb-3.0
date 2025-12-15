-- =============================================
-- Stored Procedure: sp_GetBookingPaymentIntentID
-- Description: Gets the Stripe PaymentIntentID for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetBookingPaymentIntentID]'))
    DROP PROCEDURE [dbo].[sp_GetBookingPaymentIntentID];
GO

CREATE PROCEDURE [dbo].[sp_GetBookingPaymentIntentID]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 StripePaymentIntentID FROM Bookings WHERE BookingID = @BookingID;
END
GO
