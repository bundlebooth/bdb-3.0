-- =============================================
-- Stored Procedure: sp_GetInvoiceByID
-- Description: Gets invoice details by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetInvoiceByID]'))
    DROP PROCEDURE [dbo].[sp_GetInvoiceByID];
GO

CREATE PROCEDURE [dbo].[sp_GetInvoiceByID]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT * FROM Invoices WHERE InvoiceID = @InvoiceID;
    
    IF OBJECT_ID('dbo.InvoiceItems', 'U') IS NOT NULL
    BEGIN
        SELECT * FROM InvoiceItems WHERE InvoiceID = @InvoiceID ORDER BY InvoiceItemID ASC;
    END
END
GO
