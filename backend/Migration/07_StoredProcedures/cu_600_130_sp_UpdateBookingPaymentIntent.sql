-- =============================================
-- Stored Procedure: bookings.sp_UpdatePaymentIntent
-- Description: Updates the Stripe PaymentIntentID for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_UpdatePaymentIntent]'))
    DROP PROCEDURE [bookings].[sp_UpdatePaymentIntent];
GO

CREATE PROCEDURE [bookings].[sp_UpdatePaymentIntent]
    @BookingID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE bookings.Bookings 
    SET StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
END
GO

