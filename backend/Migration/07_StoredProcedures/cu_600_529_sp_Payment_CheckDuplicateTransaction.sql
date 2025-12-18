-- =============================================
-- Stored Procedure: sp_Payment_CheckDuplicateTransaction
-- Description: Checks for duplicate/recent transactions
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_CheckDuplicateTransaction]'))
    DROP PROCEDURE [dbo].[sp_Payment_CheckDuplicateTransaction];
GO

CREATE PROCEDURE [dbo].[sp_Payment_CheckDuplicateTransaction]
    @BookingID INT,
    @Amount DECIMAL(10,2),
    @ExternalID NVARCHAR(100) = NULL,
    @Minutes INT = 180
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 TransactionID
    FROM Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded' AND (
        (StripeChargeID IS NOT NULL AND @ExternalID IS NOT NULL AND StripeChargeID = @ExternalID)
        OR (ABS(Amount - @Amount) < 0.01 AND CreatedAt > DATEADD(minute, -@Minutes, GETDATE()))
    );
END
GO
