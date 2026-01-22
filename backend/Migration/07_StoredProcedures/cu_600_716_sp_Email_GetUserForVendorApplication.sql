/*
    Migration Script: Stored Procedure - [email].[sp_GetUserForVendorApplication]
    Phase: 600 - Stored Procedures
    Script: cu_600_716_sp_Email_GetUserForVendorApplication.sql
    Description: Gets user details for vendor application email notifications
    
    Execution Order: 716
*/

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('email.sp_GetUserForVendorApplication', 'P') IS NOT NULL
    DROP PROCEDURE email.sp_GetUserForVendorApplication;
GO

CREATE PROCEDURE email.sp_GetUserForVendorApplication
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        CONCAT(FirstName, ' ', ISNULL(LastName, '')) AS Name,
        Email,
        Phone
    FROM users.Users
    WHERE UserID = @UserID;
END
GO

PRINT 'Created stored procedure: email.sp_GetUserForVendorApplication';
GO
