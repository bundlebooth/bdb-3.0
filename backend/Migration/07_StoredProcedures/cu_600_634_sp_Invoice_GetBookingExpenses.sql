-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingExpenses
-- Description: Gets booking expenses for invoice
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingExpenses]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingExpenses];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingExpenses]
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
