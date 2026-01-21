-- =============================================
-- Stored Procedure: email.sp_GetRequestForApproval
-- Description: Gets booking request details for sending approval email to client
-- Uses bookings.Bookings table (not bookings.Requests which doesn't exist)
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetRequestForApproval' AND schema_id = SCHEMA_ID('email'))
BEGIN
    DROP PROCEDURE email.sp_GetRequestForApproval;
END
GO

CREATE PROCEDURE [email].[sp_GetRequestForApproval]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.UserID,
        b.VendorProfileID,
        b.EventDate,
        b.EventTime,
        b.EventLocation,
        b.TimeZone,
        b.Services,
        b.TotalAmount,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName,
        COALESCE(JSON_VALUE(b.Services, '$[0].name'), 'Service') AS ServiceName
    FROM bookings.Bookings b
    INNER JOIN users.Users u ON b.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.BookingID = @RequestID;
END
GO
