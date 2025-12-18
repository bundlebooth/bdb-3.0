-- =============================================
-- Stored Procedure: sp_Payment_GetBookingDetails
-- Description: Gets booking details for payment success
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetBookingDetails]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetBookingDetails];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetBookingDetails]
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
    FROM Bookings b
    LEFT JOIN Users u ON b.UserID = u.UserID
    LEFT JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @BookingID;
END
GO
