-- =============================================
-- Stored Procedure: sp_Invoice_GetBookingDetails
-- Description: Gets booking details for invoice enrichment
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetBookingDetails]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetBookingDetails];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetBookingDetails]
    @BookingID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT b.BookingID, b.EventDate, b.EndDate, b.Status, b.EventName, b.EventType, b.EventLocation, b.TimeZone,
           u.Name AS ClientName, u.Email AS ClientEmail, vp.BusinessName AS VendorName
    FROM Bookings b
    INNER JOIN Users u ON b.UserID = u.UserID
    INNER JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
