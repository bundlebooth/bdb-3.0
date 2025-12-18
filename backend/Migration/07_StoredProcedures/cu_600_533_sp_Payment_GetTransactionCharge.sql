-- =============================================
-- Stored Procedure: sp_Payment_GetTransactionCharge
-- Description: Gets transaction charge ID for receipt
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetTransactionCharge]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetTransactionCharge];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetTransactionCharge]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 StripeChargeID FROM Transactions WHERE BookingID = @BookingID AND Status = 'succeeded' ORDER BY CreatedAt DESC;
END
GO
