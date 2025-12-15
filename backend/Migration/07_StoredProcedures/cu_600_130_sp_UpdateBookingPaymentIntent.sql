-- =============================================
-- Stored Procedure: sp_UpdateBookingPaymentIntent
-- Description: Updates the Stripe PaymentIntentID for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateBookingPaymentIntent]'))
    DROP PROCEDURE [dbo].[sp_UpdateBookingPaymentIntent];
GO

CREATE PROCEDURE [dbo].[sp_UpdateBookingPaymentIntent]
    @BookingID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Bookings 
    SET StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
END
GO
