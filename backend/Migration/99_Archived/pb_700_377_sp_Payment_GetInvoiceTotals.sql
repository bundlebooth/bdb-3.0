-- =============================================
-- Stored Procedure: payments.sp_GetInvoiceTotals
-- Description: Gets invoice totals for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetInvoiceTotals]'))
    DROP PROCEDURE [payments].[sp_GetInvoiceTotals];
GO

CREATE PROCEDURE [payments].[sp_GetInvoiceTotals]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID, Subtotal, TaxAmount, TotalAmount, PlatformFee, StripeFee 
    FROM invoices.Invoices 
    WHERE BookingID = @BookingID 
    ORDER BY IssueDate DESC;
END
GO

