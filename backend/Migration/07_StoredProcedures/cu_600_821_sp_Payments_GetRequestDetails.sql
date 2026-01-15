-- =============================================
-- Payments - Get Request Details
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('payments.sp_GetRequestDetails', 'P') IS NOT NULL
    DROP PROCEDURE payments.sp_GetRequestDetails;
GO

CREATE PROCEDURE payments.sp_GetRequestDetails
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use unified Bookings table, TotalAmount is the authoritative amount field
    SELECT UserID, VendorProfileID, EventDate, EventTime, EventEndTime, 
           EventLocation, AttendeeCount, TotalAmount, Services, SpecialRequests, 
           EventName, EventType, TimeZone 
    FROM bookings.Bookings 
    WHERE BookingID = @RequestID;
END
GO
