/*
    Migration Script: Create Stored Procedure [sp_GetUserDashboard]
    Phase: 600 - Stored Procedures
    Script: cu_600_054_dbo.sp_GetUserDashboard.sql
    Description: Creates the [users].[sp_GetDashboard] stored procedure
    
    Execution Order: 54
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetDashboard]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetDashboard]'))
    DROP PROCEDURE [users].[sp_GetDashboard];
GO

CREATE   PROCEDURE [users].[sp_GetDashboard]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- User info
    SELECT 
        UserID,
        Name,
        Email,
        ProfileImageURL,
        Phone,
        IsVendor
    FROM users.Users
    WHERE UserID = @UserID;
    
    -- Upcoming bookings
    SELECT TOP 5 *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    AND EventDate >= GETDATE()
    AND Status NOT IN ('cancelled', 'rejected')
    ORDER BY EventDate;
    
    -- Recent favorites
    SELECT TOP 5 *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
    
    -- Unread messages
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_UserConversations
    WHERE UserID = @UserID
    AND UnreadCount > 0;
    
    -- Unread notifications
    SELECT COUNT(*) AS UnreadNotifications
    FROM notifications.Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;
END;

GO

PRINT 'Stored procedure [users].[sp_GetDashboard] created successfully.';
GO


