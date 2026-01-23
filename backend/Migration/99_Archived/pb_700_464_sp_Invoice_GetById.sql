-- =============================================
-- Stored Procedure: invoices.sp_GetById
-- Description: Gets invoice by ID
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetById]'))
    DROP PROCEDURE [invoices].[sp_GetById];
GO

CREATE PROCEDURE [invoices].[sp_GetById]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM invoices.Invoices WHERE InvoiceID = @InvoiceID;
END
GO

