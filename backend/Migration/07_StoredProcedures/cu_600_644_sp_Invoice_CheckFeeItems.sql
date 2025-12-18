-- =============================================
-- Stored Procedure: sp_Invoice_CheckFeeItems
-- Description: Checks if invoice has fee items
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_CheckFeeItems]'))
    DROP PROCEDURE [dbo].[sp_Invoice_CheckFeeItems];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_CheckFeeItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 1 AS HasFee FROM InvoiceItems WHERE InvoiceID=@InvoiceID AND ItemType LIKE 'fee_%';
END
GO
