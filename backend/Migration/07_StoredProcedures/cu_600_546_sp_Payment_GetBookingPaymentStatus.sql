-- =============================================
-- Stored Procedure: payments.sp_GetBookingPaymentStatus
-- Description: Gets booking payment status
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingPaymentStatus]'))
    DROP PROCEDURE [payments].[sp_GetBookingPaymentStatus];
GO

CREATE PROCEDURE [payments].[sp_GetBookingPaymentStatus]
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
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



