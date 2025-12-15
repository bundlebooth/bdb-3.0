-- =============================================
-- Stored Procedure: sp_CheckDuplicateTransaction
-- Description: Checks for duplicate transactions by Stripe charge ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_CheckDuplicateTransaction]'))
    DROP PROCEDURE [dbo].[sp_CheckDuplicateTransaction];
GO

CREATE PROCEDURE [dbo].[sp_CheckDuplicateTransaction]
    @StripeChargeID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 TransactionID FROM Transactions WHERE StripeChargeID = @StripeChargeID;
END
GO
