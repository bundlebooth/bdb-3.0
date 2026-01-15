-- =============================================
-- Payments - Confirm Request
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('payments.sp_ConfirmRequest', 'P') IS NOT NULL
    DROP PROCEDURE payments.sp_ConfirmRequest;
GO

CREATE PROCEDURE payments.sp_ConfirmRequest
    @RequestID INT,
    @PaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.BookingRequests 
    SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @PaymentIntentID 
    WHERE RequestID = @RequestID;
END
GO
