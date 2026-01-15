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
    
    SELECT UserID, VendorProfileID, EventDate, EventTime, EventEndTime, 
           EventLocation, AttendeeCount, Budget, Services, SpecialRequests, 
           EventName, EventType, TimeZone 
    FROM bookings.BookingRequests 
    WHERE RequestID = @RequestID;
END
GO
