/*
    Migration Script: Create Stored Procedure [sp_Moderation_CreateAdminNotification]
    Phase: 700 - Stored Procedures
    Script: pb_700_902_sp_Moderation_CreateAdminNotification.sql
    Description: Creates an admin notification for flagged content
    Schema: admin
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_CreateAdminNotification]...';
GO

IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[sp_CreateAdminNotification]') AND type in (N'P'))
BEGIN
    DROP PROCEDURE [admin].[sp_CreateAdminNotification];
END
GO

CREATE PROCEDURE [admin].[sp_CreateAdminNotification]
    @NotificationType VARCHAR(50),
    @Priority INT = 1,
    @Title NVARCHAR(200),
    @Message NVARCHAR(MAX),
    @RelatedUserID INT = NULL,
    @RelatedViolationID INT = NULL,
    @RelatedMessageID INT = NULL,
    @RelatedConversationID INT = NULL,
    @ActionRequired BIT = 1,
    @ActionUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @NotificationID INT;
    
    INSERT INTO [admin].[AdminNotifications] (
        NotificationType, Priority, Title, Message,
        RelatedUserID, RelatedViolationID, RelatedMessageID, RelatedConversationID,
        ActionRequired, ActionUrl
    )
    VALUES (
        @NotificationType, @Priority, @Title, @Message,
        @RelatedUserID, @RelatedViolationID, @RelatedMessageID, @RelatedConversationID,
        @ActionRequired, @ActionUrl
    );
    
    SET @NotificationID = SCOPE_IDENTITY();
    
    SELECT @NotificationID AS NotificationID;
END
GO

PRINT 'Stored procedure [admin].[sp_CreateAdminNotification] created successfully.';
GO
