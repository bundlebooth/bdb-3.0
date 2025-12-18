-- =============================================
-- Stored Procedure: invoices.sp_GetBookingSnapshot
-- Description: Gets booking core data for invoice snapshot
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingSnapshot]'))
    DROP PROCEDURE [invoices].[sp_GetBookingSnapshot];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingSnapshot]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 
      b.BookingID, b.UserID, b.VendorProfileID, b.EventDate, b.EndDate, b.Status,
      b.TotalAmount, b.DepositAmount, b.DepositPaid, b.FullAmountPaid,
      b.EventName, b.EventType, b.EventLocation, b.TimeZone, b.ServiceID,
      u.Name AS ClientName, u.Email AS ClientEmail,
      vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



