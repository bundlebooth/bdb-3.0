-- =============================================
-- Stored Procedure: sp_Payment_ConfirmBookingRequest
-- Description: Confirms booking request after payment
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_ConfirmBookingRequest]'))
    DROP PROCEDURE [dbo].[sp_Payment_ConfirmBookingRequest];
GO

CREATE PROCEDURE [dbo].[sp_Payment_ConfirmBookingRequest]
    @UserID INT,
    @VendorProfileID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE BookingRequests
    SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
    WHERE RequestID = (
        SELECT TOP 1 RequestID FROM BookingRequests
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC
    );
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
