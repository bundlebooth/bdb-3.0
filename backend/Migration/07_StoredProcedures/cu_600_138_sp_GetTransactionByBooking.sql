-- =============================================
-- Stored Procedure: payments.sp_GetTransactionByBooking
-- Description: Gets transaction by booking ID
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetTransactionByBooking]'))
    DROP PROCEDURE [payments].[sp_GetTransactionByBooking];
GO

CREATE PROCEDURE [payments].[sp_GetTransactionByBooking]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 StripeChargeID 
    FROM payments.Transactions 
    WHERE BookingID = @BookingID AND Status = 'succeeded' 
    ORDER BY CreatedAt DESC;
END
GO

