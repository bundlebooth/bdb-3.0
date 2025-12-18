-- =============================================
-- Stored Procedure: payments.sp_CheckDuplicateTransaction
-- Description: Checks for duplicate transactions by Stripe charge ID
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_CheckDuplicateTransaction]'))
    DROP PROCEDURE [payments].[sp_CheckDuplicateTransaction];
GO

CREATE PROCEDURE [payments].[sp_CheckDuplicateTransaction]
    @StripeChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 TransactionID FROM payments.Transactions WHERE StripeChargeID = @StripeChargeID;
END
GO

