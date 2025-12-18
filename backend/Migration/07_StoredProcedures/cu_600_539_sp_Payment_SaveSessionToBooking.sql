-- =============================================
-- Stored Procedure: sp_Payment_SaveSessionToBooking
-- Description: Saves Stripe session ID to booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_SaveSessionToBooking]'))
    DROP PROCEDURE [dbo].[sp_Payment_SaveSessionToBooking];
GO

CREATE PROCEDURE [dbo].[sp_Payment_SaveSessionToBooking]
    @BookingID INT,
    @StripeSessionID NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Bookings 
    SET StripeSessionID = @StripeSessionID, UpdatedAt = GETDATE()
    WHERE BookingID = @BookingID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
