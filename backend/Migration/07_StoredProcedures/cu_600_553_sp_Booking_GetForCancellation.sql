-- =============================================
-- Stored Procedure: bookings.sp_GetForCancellation
-- Description: Gets booking details needed for cancellation/refund processing
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetForCancellation]'))
    DROP PROCEDURE [bookings].[sp_GetForCancellation];
GO

CREATE PROCEDURE [bookings].[sp_GetForCancellation]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID,
        b.UserID,
        b.VendorProfileID,
        b.EventDate,
        b.Status,
        b.TotalAmount,
        b.StripePaymentIntentID,
        b.FullAmountPaid,
        b.CancelledBy,
        b.CancellationDate,
        b.RefundAmount,
        vp.StripeAccountID,
        vp.BusinessName AS VendorName,
        u.FirstName + ' ' + u.LastName AS ClientName,
        u.Email AS ClientEmail,
        DATEDIFF(HOUR, GETDATE(), b.EventDate) AS HoursUntilEvent,
        cp.FullRefundHours,
        cp.PartialRefundHours,
        cp.PartialRefundPercent,
        cp.NoRefundHours,
        cp.CancellationFee,
        cp.AllowClientCancellation,
        cp.AllowVendorCancellation,
        cp.PolicyName
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    INNER JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorCancellationPolicies cp ON b.VendorProfileID = cp.VendorProfileID AND cp.IsActive = 1
    WHERE b.BookingID = @BookingID;
END
GO

