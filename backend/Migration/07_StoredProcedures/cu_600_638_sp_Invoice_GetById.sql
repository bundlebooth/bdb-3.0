-- =============================================
-- Stored Procedure: sp_Invoice_GetById
-- Description: Gets invoice by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetById]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetById];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetById]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * FROM Invoices WHERE InvoiceID = @InvoiceID;
END
GO
