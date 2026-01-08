-- =============================================
-- Stored Procedure: invoices.sp_GetExistingInvoice
-- Description: Gets existing invoice ID for booking
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetExistingInvoice]'))
    DROP PROCEDURE [invoices].[sp_GetExistingInvoice];
GO

CREATE PROCEDURE [invoices].[sp_GetExistingInvoice]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID FROM invoices.Invoices WHERE BookingID = @BookingID;
END
GO

