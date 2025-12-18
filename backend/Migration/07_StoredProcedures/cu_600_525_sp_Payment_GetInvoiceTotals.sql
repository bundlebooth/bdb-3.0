-- =============================================
-- Stored Procedure: sp_Payment_GetInvoiceTotals
-- Description: Gets invoice totals for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetInvoiceTotals]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetInvoiceTotals];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetInvoiceTotals]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID, Subtotal, TaxAmount, TotalAmount, PlatformFee, StripeFee 
    FROM Invoices 
    WHERE BookingID = @BookingID 
    ORDER BY IssueDate DESC;
END
GO
