-- =============================================
-- Stored Procedure: invoices.sp_GetPayments
-- Description: Gets payments for an invoice's booking
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetPayments]'))
    DROP PROCEDURE [invoices].[sp_GetPayments];
GO

CREATE PROCEDURE [invoices].[sp_GetPayments]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT t.StripeChargeID, t.Amount, t.FeeAmount, t.NetAmount, t.Currency, t.CreatedAt
    FROM payments.Transactions t
    WHERE t.BookingID = (SELECT BookingID FROM invoices.Invoices WHERE InvoiceID=@InvoiceID)
    ORDER BY t.CreatedAt ASC;
END
GO


