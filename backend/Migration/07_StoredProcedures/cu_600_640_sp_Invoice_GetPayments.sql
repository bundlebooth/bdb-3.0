-- =============================================
-- Stored Procedure: sp_Invoice_GetPayments
-- Description: Gets payments for an invoice's booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetPayments]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetPayments];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetPayments]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT t.StripeChargeID, t.Amount, t.FeeAmount, t.NetAmount, t.Currency, t.CreatedAt
    FROM Transactions t
    WHERE t.BookingID = (SELECT BookingID FROM Invoices WHERE InvoiceID=@InvoiceID)
    ORDER BY t.CreatedAt ASC;
END
GO
