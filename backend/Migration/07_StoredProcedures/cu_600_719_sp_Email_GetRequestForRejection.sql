-- =============================================
-- Stored Procedure: email.sp_GetRequestForRejection
-- Description: Gets booking request details for sending rejection email to client
-- Uses bookings.Bookings table (not bookings.Requests which doesn't exist)
-- =============================================

IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'sp_GetRequestForRejection' AND schema_id = SCHEMA_ID('email'))
BEGIN
    DROP PROCEDURE email.sp_GetRequestForRejection;
END
GO

CREATE PROCEDURE [email].[sp_GetRequestForRejection]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        b.UserID,
        b.EventDate,
        b.EventTime,
        b.EventLocation,
        b.Services,
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
