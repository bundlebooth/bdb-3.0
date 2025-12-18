-- =============================================
-- Stored Procedure: sp_Invoice_GetExistingInvoice
-- Description: Gets existing invoice ID for booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetExistingInvoice]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetExistingInvoice];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetExistingInvoice]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID = @BookingID;
END
GO
