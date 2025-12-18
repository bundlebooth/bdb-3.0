-- =============================================
-- Stored Procedure: invoices.sp_GetByBookingId
-- Description: Gets invoice ID by booking ID
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetByBookingId]'))
    DROP PROCEDURE [invoices].[sp_GetByBookingId];
GO

CREATE PROCEDURE [invoices].[sp_GetByBookingId]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID FROM invoices.Invoices WHERE BookingID = @BookingID;
END
GO

