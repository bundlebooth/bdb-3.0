-- =============================================
-- Stored Procedure: payments.sp_GetBookingExpenses
-- Description: Gets booking expenses
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingExpenses]'))
    DROP PROCEDURE [payments].[sp_GetBookingExpenses];
GO

CREATE PROCEDURE [payments].[sp_GetBookingExpenses]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Amount FROM BookingExpenses WHERE BookingID = @BookingID;
END
GO
