-- =============================================
-- Stored Procedure: invoices.sp_GetWithFeesFlag
-- Description: Gets invoice with fees included flag
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetWithFeesFlag]'))
    DROP PROCEDURE [invoices].[sp_GetWithFeesFlag];
GO

CREATE PROCEDURE [invoices].[sp_GetWithFeesFlag]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID, FeesIncludedInTotal FROM invoices.Invoices WHERE BookingID=@BookingID ORDER BY IssueDate DESC;
END
GO

