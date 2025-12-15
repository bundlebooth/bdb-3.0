/*
    Migration Script: Create Stored Procedure [sp_GetUserDashboard]
    Phase: 600 - Stored Procedures
    Script: cu_600_054_dbo.sp_GetUserDashboard.sql
    Description: Creates the [dbo].[sp_GetUserDashboard] stored procedure
    
    Execution Order: 54
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserDashboard]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserDashboard]'))
    DROP PROCEDURE [dbo].[sp_GetUserDashboard];
GO

CREATE   PROCEDURE [dbo].[sp_GetUserDashboard]
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
    FROM Users
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
    FROM Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetUserDashboard] created successfully.';
GO
