-- =============================================
-- Stored Procedure: invoices.sp_GetBookingDetails
-- Description: Gets booking details for invoice enrichment
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetBookingDetails]'))
    DROP PROCEDURE [invoices].[sp_GetBookingDetails];
GO

CREATE PROCEDURE [invoices].[sp_GetBookingDetails]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.EventDate, b.EndDate, b.Status, b.EventName, b.EventType, b.EventLocation, b.TimeZone,
           u.Name AS ClientName, u.Email AS ClientEmail, vp.BusinessName AS VendorName
    FROM bookings.Bookings b
    INNER JOIN users.Users u ON b.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO



