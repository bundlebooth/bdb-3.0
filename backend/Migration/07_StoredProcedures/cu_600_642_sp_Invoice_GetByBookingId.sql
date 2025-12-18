-- =============================================
-- Stored Procedure: sp_Invoice_GetByBookingId
-- Description: Gets invoice ID by booking ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetByBookingId]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetByBookingId];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetByBookingId]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 InvoiceID FROM Invoices WHERE BookingID = @BookingID;
END
GO
