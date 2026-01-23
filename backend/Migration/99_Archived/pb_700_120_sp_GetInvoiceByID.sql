-- =============================================
-- Stored Procedure: invoices.sp_GetByID
-- Description: Gets invoice details by ID
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetByID]'))
    DROP PROCEDURE [invoices].[sp_GetByID];
GO

CREATE PROCEDURE [invoices].[sp_GetByID]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM invoices.Invoices WHERE InvoiceID = @InvoiceID;
    
    IF OBJECT_ID('dbo.InvoiceItems', 'U') IS NOT NULL
    BEGIN
        SELECT * FROM invoices.InvoiceItems WHERE InvoiceID = @InvoiceID ORDER BY InvoiceItemID ASC;
    END
END
GO


