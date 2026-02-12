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
        r.Subtotal,
        r.PlatformFee,
        r.TaxAmount,
        r.TaxPercent,
        r.TaxLabel,
        r.ProcessingFee,
        r.GrandTotal,
        r.EventLocation,
        r.Budget
    FROM bookings.BookingRequests r
    WHERE r.RequestID = @RequestID
END
GO
