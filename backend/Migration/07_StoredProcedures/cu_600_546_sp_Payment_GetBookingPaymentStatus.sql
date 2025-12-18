-- =============================================
-- Stored Procedure: sp_Payment_GetBookingPaymentStatus
-- Description: Gets booking payment status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingPaymentStatus]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingPaymentStatus];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingPaymentStatus]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.Status,
        b.FullAmountPaid,
        b.DepositPaid,
        b.StripePaymentIntentID,
        b.TotalAmount,
        b.EventDate,
        b.EventName,
        b.EventType,
        b.EventLocation,
        b.UpdatedAt,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
