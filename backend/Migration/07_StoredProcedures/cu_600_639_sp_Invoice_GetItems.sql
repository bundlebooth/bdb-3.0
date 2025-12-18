-- =============================================
-- Stored Procedure: sp_Invoice_GetItems
-- Description: Gets invoice items
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetItems]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetItems];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM InvoiceItems WHERE InvoiceID = @InvoiceID ORDER BY InvoiceItemID ASC;
END
GO
