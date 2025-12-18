-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingTransactions
-- Description: Gets booking transactions for invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingTransactions]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingTransactions];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingTransactions]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeChargeID, FeeAmount, Amount, CreatedAt
    FROM Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded'
    ORDER BY CreatedAt ASC;
END
GO
