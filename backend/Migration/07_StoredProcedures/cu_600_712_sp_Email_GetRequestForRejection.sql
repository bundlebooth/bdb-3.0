/*
    Migration Script: Create Stored Procedure [email.sp_GetRequestForRejection]
    Phase: 600 - Stored Procedures
    Description: Gets request details for booking rejected email notification
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [email].[sp_GetRequestForRejection]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[email].[sp_GetRequestForRejection]'))
    DROP PROCEDURE [email].[sp_GetRequestForRejection];
GO

CREATE PROCEDURE [email].[sp_GetRequestForRejection]
    @RequestID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        br.UserID,
        br.EventDate,
        u.Name AS ClientName,
        u.Email AS ClientEmail,
        vp.BusinessName AS VendorName,
        COALESCE(JSON_VALUE(br.Services, '$[0].name'), 'Service') AS ServiceName
    FROM bookings.Requests br
    INNER JOIN users.Users u ON br.UserID = u.UserID
    INNER JOIN vendors.VendorProfiles vp ON br.VendorProfileID = vp.VendorProfileID
    WHERE br.RequestID = @RequestID;
END
GO

PRINT 'Stored procedure [email].[sp_GetRequestForRejection] created successfully.';
GO
