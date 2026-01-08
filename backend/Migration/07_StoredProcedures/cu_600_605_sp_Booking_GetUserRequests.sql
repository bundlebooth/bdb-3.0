-- =============================================
-- Stored Procedure: bookings.sp_GetUserRequests
-- Description: Gets booking requests for a user
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetUserRequests]'))
    DROP PROCEDURE [bookings].[sp_GetUserRequests];
GO

CREATE PROCEDURE [bookings].[sp_GetUserRequests]
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
    FROM bookings.BookingRequests br
    LEFT JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    WHERE br.UserID = @UserID
    ORDER BY br.CreatedAt DESC;
END
GO


