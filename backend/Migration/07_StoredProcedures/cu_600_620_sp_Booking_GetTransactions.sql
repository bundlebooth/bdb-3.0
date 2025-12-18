-- =============================================
-- Stored Procedure: sp_Booking_GetTransactions
-- Description: Gets transactions for a booking
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetTransactions]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetTransactions];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetTransactions]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Amount, FeeAmount, NetAmount, Currency, CreatedAt 
    FROM Transactions WHERE BookingID = @BookingID ORDER BY CreatedAt;
END
GO
