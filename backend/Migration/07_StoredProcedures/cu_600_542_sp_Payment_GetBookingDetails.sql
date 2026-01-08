-- =============================================
-- Stored Procedure: payments.sp_GetBookingDetails
-- Description: Gets booking details for payment success
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetBookingDetails]'))
    DROP PROCEDURE [payments].[sp_GetBookingDetails];
GO

CREATE PROCEDURE [payments].[sp_GetBookingDetails]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BookingID, b.UserID, b.VendorProfileID, b.EventDate, b.EndDate,
        b.EventName, b.EventType, b.EventLocation, b.Status, b.TotalAmount,
        b.FullAmountPaid, b.AttendeeCount, b.SpecialRequests, b.CreatedAt,
        u.Name AS ClientName, u.Email AS ClientEmail,
        vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    LEFT JOIN users.Users u ON b.UserID = u.UserID
    LEFT JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



