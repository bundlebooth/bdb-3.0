-- =============================================
-- Stored Procedure: payments.sp_SaveChargeToBooking
-- Description: Saves Stripe charge/payment intent ID to booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_SaveChargeToBooking]'))
    DROP PROCEDURE [payments].[sp_SaveChargeToBooking];
GO

CREATE PROCEDURE [payments].[sp_SaveChargeToBooking]
    @BookingID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

