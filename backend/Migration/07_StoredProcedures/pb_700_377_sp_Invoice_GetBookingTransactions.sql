-- =============================================
-- Stored Procedure: invoices.sp_GetBookingTransactions
-- Description: Gets booking transactions for invoice
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingTransactions]'))
    DROP PROCEDURE [invoices].[sp_GetBookingTransactions];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingTransactions]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeChargeID, FeeAmount, Amount, CreatedAt
    FROM payments.Transactions
    WHERE BookingID = @BookingID AND Status = 'succeeded'
    ORDER BY CreatedAt ASC;
END
GO

