/*
    Migration Script: Create Stored Procedure [sp_Moderation_GetAdminNotifications]
    Phase: 700 - Stored Procedures
    Script: pb_700_905_sp_Moderation_GetAdminNotifications.sql
    Description: Gets admin notifications with pagination and filtering
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetAdminNotifications]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAdminNotifications]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_GetAdminNotifications];
END
GO

CREATE PROCEDURE [admin].[sp_GetAdminNotifications]
    @Page INT = 1,
    @Limit INT = 20,
    @IsRead BIT = NULL,
    @NotificationType VARCHAR(50) = NULL,
    @Priority INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @Limit;
    DECLARE @Total INT;
    DECLARE @UnreadCount INT;
    
    -- Get total count
    SELECT @Total = COUNT(*)
    FROM [admin].[AdminNotifications] an
    WHERE (@IsRead IS NULL OR an.IsRead = @IsRead)
    AND (@NotificationType IS NULL OR an.NotificationType = @NotificationType)
    AND (@Priority IS NULL OR an.Priority = @Priority);
    
    -- Get unread count
    SELECT @UnreadCount = COUNT(*)
    FROM [admin].[AdminNotifications]
    WHERE IsRead = 0;
    
    -- Get paginated results
    SELECT 
        an.NotificationID,
        an.NotificationType,
        an.Priority,
        an.Title,
        an.Message,
        an.RelatedUserID,
        u.FirstName + ' ' + ISNULL(u.LastName, '') AS RelatedUserName,
        u.Email AS RelatedUserEmail,
        an.RelatedViolationID,
        an.RelatedMessageID,
        an.RelatedConversationID,
        an.ActionRequired,
        an.ActionUrl,
        an.IsRead,
        an.ReadByAdminID,
        an.ReadAt,
        an.IsResolved,
        an.ResolvedByAdminID,
        an.ResolvedAt,
        an.ResolutionNotes,
        an.CreatedAt,
        @Total AS TotalCount,
        @UnreadCount AS UnreadCount
    FROM [admin].[AdminNotifications] an
    LEFT JOIN [users].[Users] u ON an.RelatedUserID = u.UserID
    WHERE (@IsRead IS NULL OR an.IsRead = @IsRead)
    AND (@NotificationType IS NULL OR an.NotificationType = @NotificationType)
    AND (@Priority IS NULL OR an.Priority = @Priority)
    ORDER BY an.Priority DESC, an.CreatedAt DESC
    OFFSET @Offset ROWS
    FETCH NEXT @Limit ROWS ONLY;
END
GO

PRINT 'Stored procedure [admin].[sp_GetAdminNotifications] created successfully.';
GO
