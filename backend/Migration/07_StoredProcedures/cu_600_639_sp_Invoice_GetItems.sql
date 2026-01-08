-- =============================================
-- Stored Procedure: invoices.sp_GetItems
-- Description: Gets invoice items
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetItems]'))
    DROP PROCEDURE [invoices].[sp_GetItems];
GO

CREATE PROCEDURE [invoices].[sp_GetItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM invoices.InvoiceItems WHERE InvoiceID = @InvoiceID ORDER BY InvoiceItemID ASC;
END
GO

