-- =============================================
-- Stored Procedure: payments.sp_GetBookingFinancials
-- Description: Get booking financial details for payment intent creation
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingFinancials]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [payments].[sp_GetBookingFinancials]
GO

CREATE PROCEDURE [payments].[sp_GetBookingFinancials]
    @BookingID INT
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
        b.TotalAmount,
        b.EventTime,
        b.EventEndTime,
        b.Services
    FROM bookings.Bookings b
    WHERE b.BookingID = @BookingID
END
GO
