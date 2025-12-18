-- =============================================
-- Stored Procedure: sp_Invoice_GetWithFeesFlag
-- Description: Gets invoice with fees included flag
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetWithFeesFlag]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetWithFeesFlag];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetWithFeesFlag]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID, FeesIncludedInTotal FROM Invoices WHERE BookingID=@BookingID ORDER BY IssueDate DESC;
END
GO
