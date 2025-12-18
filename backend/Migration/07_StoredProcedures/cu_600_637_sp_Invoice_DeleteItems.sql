-- =============================================
-- Stored Procedure: sp_Invoice_DeleteItems
-- Description: Deletes invoice items for regeneration
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_DeleteItems]'))
    DROP PROCEDURE [dbo].[sp_Invoice_DeleteItems];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_DeleteItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM InvoiceItems WHERE InvoiceID = @InvoiceID;
    
    SELECT @@ROWCOUNT AS RowsDeleted;
END
GO
