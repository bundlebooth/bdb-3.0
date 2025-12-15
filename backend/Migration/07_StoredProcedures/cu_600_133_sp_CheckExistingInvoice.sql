-- =============================================
-- Stored Procedure: sp_CheckExistingInvoice
-- Description: Checks if an invoice exists for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckExistingInvoice]'))
    DROP PROCEDURE [dbo].[sp_CheckExistingInvoice];
GO

CREATE PROCEDURE [dbo].[sp_CheckExistingInvoice]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID = @BookingID;
END
GO
