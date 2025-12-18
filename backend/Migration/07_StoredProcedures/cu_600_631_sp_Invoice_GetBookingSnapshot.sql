-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingSnapshot
-- Description: Gets booking core data for invoice snapshot
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingSnapshot]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingSnapshot];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingSnapshot]
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
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
