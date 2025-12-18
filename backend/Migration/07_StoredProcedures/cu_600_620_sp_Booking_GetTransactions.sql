-- =============================================
-- Stored Procedure: bookings.sp_GetTransactions
-- Description: Gets transactions for a booking
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetTransactions]'))
    DROP PROCEDURE [bookings].[sp_GetTransactions];
GO

CREATE PROCEDURE [bookings].[sp_GetTransactions]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Amount, FeeAmount, NetAmount, Currency, CreatedAt 
    FROM payments.Transactions WHERE BookingID = @BookingID ORDER BY CreatedAt;
END
GO

