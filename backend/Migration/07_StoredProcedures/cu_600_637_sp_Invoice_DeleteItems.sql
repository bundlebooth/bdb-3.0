-- =============================================
-- Stored Procedure: invoices.sp_DeleteItems
-- Description: Deletes invoice items for regeneration
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_DeleteItems]'))
    DROP PROCEDURE [invoices].[sp_DeleteItems];
GO

CREATE PROCEDURE [invoices].[sp_DeleteItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM invoices.InvoiceItems WHERE InvoiceID = @InvoiceID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO

