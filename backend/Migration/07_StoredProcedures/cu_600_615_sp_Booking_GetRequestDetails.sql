-- =============================================
-- Stored Procedure: sp_Booking_GetRequestDetails
-- Description: Gets booking request details
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetRequestDetails]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetRequestDetails];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetRequestDetails]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT EventDate, EventTime, EventLocation, AttendeeCount, Budget, Services, SpecialRequests
    FROM BookingRequests 
    WHERE RequestID = @RequestID;
END
GO
