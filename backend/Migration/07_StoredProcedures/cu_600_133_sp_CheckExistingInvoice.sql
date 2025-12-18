-- =============================================
-- Stored Procedure: invoices.sp_CheckExisting
-- Description: Checks if an invoice exists for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_CheckExisting]'))
    DROP PROCEDURE [invoices].[sp_CheckExisting];
GO

CREATE PROCEDURE [invoices].[sp_CheckExisting]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 InvoiceID FROM invoices.Invoices WHERE BookingID = @BookingID;
END
GO

