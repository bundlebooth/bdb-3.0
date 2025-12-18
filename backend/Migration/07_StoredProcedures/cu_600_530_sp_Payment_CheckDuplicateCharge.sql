-- =============================================
-- Stored Procedure: payments.sp_CheckDuplicateCharge
-- Description: Checks for duplicate charge by StripeChargeID
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_CheckDuplicateCharge]'))
    DROP PROCEDURE [payments].[sp_CheckDuplicateCharge];
GO

CREATE PROCEDURE [payments].[sp_CheckDuplicateCharge]
    @StripeChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 TransactionID FROM payments.Transactions WHERE StripeChargeID = @StripeChargeID;
END
GO

