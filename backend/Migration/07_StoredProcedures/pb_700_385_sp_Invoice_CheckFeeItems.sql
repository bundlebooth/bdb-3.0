-- =============================================
-- Stored Procedure: invoices.sp_CheckFeeItems
-- Description: Checks if invoice has fee items
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_CheckFeeItems]'))
    DROP PROCEDURE [invoices].[sp_CheckFeeItems];
GO

CREATE PROCEDURE [invoices].[sp_CheckFeeItems]
    @InvoiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 1 AS HasFee FROM invoices.InvoiceItems WHERE InvoiceID=@InvoiceID AND ItemType LIKE 'fee_%';
END
GO

