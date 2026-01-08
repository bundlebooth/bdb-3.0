-- =============================================
-- Stored Procedure: payments.sp_ConfirmBookingRequest
-- Description: Confirms booking request after payment
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_ConfirmBookingRequest]'))
    DROP PROCEDURE [payments].[sp_ConfirmBookingRequest];
GO

CREATE PROCEDURE [payments].[sp_ConfirmBookingRequest]
    @UserID INT,
    @VendorProfileID INT,
    @StripePaymentIntentID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE bookings.BookingRequests
    SET Status = 'confirmed', ConfirmedAt = GETDATE(), PaymentIntentID = @StripePaymentIntentID
    WHERE RequestID = (
        SELECT TOP 1 RequestID FROM bookings.BookingRequests
        WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID
        ORDER BY CreatedAt DESC
    );
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

