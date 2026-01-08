-- =============================================
-- Stored Procedure: invoices.sp_GetBookingExpenses
-- Description: Gets booking expenses for invoice
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingExpenses]'))
    DROP PROCEDURE [invoices].[sp_GetBookingExpenses];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingExpenses]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt
    FROM BookingExpenses
    WHERE BookingID = @BookingID
    ORDER BY CreatedAt ASC;
END
GO
