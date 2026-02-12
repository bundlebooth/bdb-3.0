-- =============================================
-- Stored Procedure: notifications.sp_GetUserForNotification
-- Description: Gets user info needed for sending notifications (Email, FirstName, LastName)
-- Phase: 700 (Stored Procedures)
-- Schema: notifications
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[notifications].[sp_GetUserForNotification]'))
    DROP PROCEDURE [notifications].[sp_GetUserForNotification];
GO

CREATE PROCEDURE [notifications].[sp_GetUserForNotification]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Email,
        u.FirstName,
        u.LastName,
        LTRIM(RTRIM(CONCAT(ISNULL(u.FirstName, ''), ' ', ISNULL(u.LastName, '')))) AS FullName
    FROM users.Users u
    WHERE u.UserID = @UserID
      AND u.IsActive = 1;
END
GO
