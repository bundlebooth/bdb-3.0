-- =============================================
-- Stored Procedure: bookings.sp_GetBookingExpenses
-- Description: Gets expenses for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingExpenses]'))
    DROP PROCEDURE [bookings].[sp_GetBookingExpenses];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingExpenses]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt 
    FROM BookingExpenses WHERE BookingID = @BookingID ORDER BY CreatedAt;
END
GO
