-- =============================================
-- Stored Procedure: bookings.sp_GetInvoiceTotals
-- Description: Gets invoice totals for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetInvoiceTotals]'))
    DROP PROCEDURE [bookings].[sp_GetInvoiceTotals];
GO

CREATE PROCEDURE [bookings].[sp_GetInvoiceTotals]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID, TotalAmount, PlatformFee, Subtotal, TaxAmount 
    FROM invoices.Invoices WHERE BookingID=@BookingID ORDER BY IssueDate DESC;
END
GO

