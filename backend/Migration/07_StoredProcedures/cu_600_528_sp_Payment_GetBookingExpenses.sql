-- =============================================
-- Stored Procedure: sp_Payment_GetBookingExpenses
-- Description: Gets booking expenses
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingExpenses]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingExpenses];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingExpenses]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Amount FROM BookingExpenses WHERE BookingID = @BookingID;
END
GO
