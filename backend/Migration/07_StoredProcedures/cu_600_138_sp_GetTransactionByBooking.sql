-- =============================================
-- Stored Procedure: sp_GetTransactionByBooking
-- Description: Gets transaction by booking ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetTransactionByBooking]'))
    DROP PROCEDURE [dbo].[sp_GetTransactionByBooking];
GO

CREATE PROCEDURE [dbo].[sp_GetTransactionByBooking]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 StripeChargeID 
    FROM Transactions 
    WHERE BookingID = @BookingID AND Status = 'succeeded' 
    ORDER BY CreatedAt DESC;
END
GO
