-- =============================================
-- Stored Procedure: payments.sp_GetRecentTransaction
-- Description: Gets recent transaction for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetRecentTransaction]'))
    DROP PROCEDURE [payments].[sp_GetRecentTransaction];
GO

CREATE PROCEDURE [payments].[sp_GetRecentTransaction]
    @BookingID INT,
    @Amount DECIMAL(10,2),
    @ExternalID NVARCHAR(100) = NULL,
    @Minutes INT = 180
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 TransactionID
    FROM payments.Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded' AND (
        (StripeChargeID IS NOT NULL AND @ExternalID IS NOT NULL AND StripeChargeID = @ExternalID)
        OR (ABS(Amount - @Amount) < 0.01 AND CreatedAt > DATEADD(minute, -@Minutes, GETDATE()))
    );
END
GO

