-- =============================================
-- Stored Procedure: payments.sp_GetRequestFinancials
-- Description: Get request financial details for payment intent creation
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[payments].[sp_GetRequestFinancials]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [payments].[sp_GetRequestFinancials]
GO

CREATE PROCEDURE [payments].[sp_GetRequestFinancials]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.Subtotal,
        b.PlatformFee,
        b.TaxAmount,
        b.TaxPercent,
        b.TaxLabel,
        b.ProcessingFee,
        b.GrandTotal,
        b.EventLocation,
        b.Budget
    FROM bookings.Bookings b
    WHERE b.RequestID = @RequestID
END
GO
