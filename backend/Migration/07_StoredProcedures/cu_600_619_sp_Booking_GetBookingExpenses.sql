-- =============================================
-- Stored Procedure: sp_Booking_GetBookingExpenses
-- Description: Gets expenses for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetBookingExpenses]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetBookingExpenses];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetBookingExpenses]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT BookingExpenseID, Title, Amount, Notes, CreatedAt 
    FROM BookingExpenses WHERE BookingID = @BookingID ORDER BY CreatedAt;
END
GO
