-- =============================================
-- Stored Procedure: sp_Payment_SaveChargeToBooking
-- Description: Saves Stripe charge/payment intent ID to booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_SaveChargeToBooking]'))
    DROP PROCEDURE [dbo].[sp_Payment_SaveChargeToBooking];
GO

CREATE PROCEDURE [dbo].[sp_Payment_SaveChargeToBooking]
    @BookingID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET StripePaymentIntentID = @StripePaymentIntentID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
