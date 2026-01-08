-- =============================================
-- Stored Procedure: payments.sp_GetReceiptInfo
-- Description: Gets payment intent ID for receipt
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetReceiptInfo]'))
    DROP PROCEDURE [payments].[sp_GetReceiptInfo];
GO

CREATE PROCEDURE [payments].[sp_GetReceiptInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 StripePaymentIntentID FROM bookings.Bookings WHERE BookingID = @BookingID;
END
GO

