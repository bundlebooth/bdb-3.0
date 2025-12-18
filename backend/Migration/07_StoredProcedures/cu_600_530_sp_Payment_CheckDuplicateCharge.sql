-- =============================================
-- Stored Procedure: sp_Payment_CheckDuplicateCharge
-- Description: Checks for duplicate charge by StripeChargeID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_CheckDuplicateCharge]'))
    DROP PROCEDURE [dbo].[sp_Payment_CheckDuplicateCharge];
GO

CREATE PROCEDURE [dbo].[sp_Payment_CheckDuplicateCharge]
    @StripeChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 TransactionID FROM Transactions WHERE StripeChargeID = @StripeChargeID;
END
GO
