-- =============================================
-- Stored Procedure: sp_Booking_GetUserRequests
-- Description: Gets booking requests for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetUserRequests]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetUserRequests];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetUserRequests]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        br.RequestID,
        br.VendorProfileID,
        vp.BusinessName as VendorName,
        br.Services,
        br.EventDate,
        CONVERT(VARCHAR(8), br.EventTime, 108) AS EventTime,
        CONVERT(VARCHAR(8), br.EventEndTime, 108) AS EventEndTime,
        br.EventLocation,
        br.AttendeeCount,
        br.Budget,
        br.SpecialRequests,
        br.EventName,
        br.EventType,
        br.TimeZone,
        br.Status,
        br.CreatedAt,
        br.ExpiresAt,
        br.ResponseMessage
    FROM BookingRequests br
    LEFT JOIN VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    WHERE br.UserID = @UserID
    ORDER BY br.CreatedAt DESC;
END
GO
