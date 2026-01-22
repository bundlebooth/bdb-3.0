-- =============================================
-- Stored Procedure: bookings.sp_GetBookingInfo
-- Description: Gets booking info for invoice
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetBookingInfo]'))
    DROP PROCEDURE [bookings].[sp_GetBookingInfo];
GO

CREATE PROCEDURE [bookings].[sp_GetBookingInfo]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.UserID AS ClientUserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
           b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid, b.StripePaymentIntentID,
           CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) AS ClientName, u.Email AS ClientEmail, u.Phone AS ClientPhone,
           vp.BusinessName AS VendorName, vp.BusinessEmail AS VendorEmail, vp.BusinessPhone AS VendorPhone,
           vp.UserID AS VendorUserID
    FROM bookings.Bookings b
    JOIN users.Users u ON b.UserID = u.UserID
    JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



