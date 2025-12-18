-- =============================================
-- Stored Procedure: payments.sp_SaveSessionToBooking
-- Description: Saves Stripe session ID to booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_SaveSessionToBooking]'))
    DROP PROCEDURE [payments].[sp_SaveSessionToBooking];
GO

CREATE PROCEDURE [payments].[sp_SaveSessionToBooking]
    @BookingID INT,
    @StripeSessionID NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.Bookings 
    SET StripeSessionID = @StripeSessionID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

