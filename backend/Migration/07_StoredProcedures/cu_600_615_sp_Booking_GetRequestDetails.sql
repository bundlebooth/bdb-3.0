-- =============================================
-- Stored Procedure: bookings.sp_GetRequestDetails
-- Description: Gets booking request details
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetRequestDetails]'))
    DROP PROCEDURE [bookings].[sp_GetRequestDetails];
GO

CREATE PROCEDURE [bookings].[sp_GetRequestDetails]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT EventDate, EventTime, EventLocation, AttendeeCount, Budget, Services, SpecialRequests
    FROM bookings.BookingRequests 
    WHERE RequestID = @RequestID;
END
GO

