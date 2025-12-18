-- =============================================
-- Stored Procedure: sp_Payment_GetReceiptInfo
-- Description: Gets payment intent ID for receipt
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetReceiptInfo]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetReceiptInfo];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetReceiptInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 StripePaymentIntentID FROM Bookings WHERE BookingID = @BookingID;
END
GO
