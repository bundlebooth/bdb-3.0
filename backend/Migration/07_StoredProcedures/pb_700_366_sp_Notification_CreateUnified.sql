/*
    Migration Script: Stored Procedure - Create Unified Notification
    Phase: 700 - Stored Procedures
    Script: pb_700_366_sp_Notification_CreateUnified.sql
    Description: Creates a notification with unified icon support.
                 Used by the UnifiedNotificationService to create in-app notifications.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[notifications].[sp_Notification_CreateUnified]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [notifications].[sp_Notification_CreateUnified];
GO

CREATE PROCEDURE [notifications].[sp_Notification_CreateUnified]
    @UserID INT,
    @Title NVARCHAR(255),
    @Message NVARCHAR(MAX),
    @Type NVARCHAR(50),
    @IconType NVARCHAR(100) = NULL,
    @RelatedID INT = NULL,
    @RelatedType NVARCHAR(50) = NULL,
    @ActionURL NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        INSERT INTO [notifications].[Notifications] 
        (
            UserID, 
            Title, 
            Message, 
            Type, 
            IconType,
            IsRead, 
            RelatedID, 
            RelatedType, 
            ActionURL, 
            CreatedAt
        )
        VALUES 
        (
            @UserID, 
            @Title, 
            @Message, 
            @Type, 
            @IconType,
            0, 
            @RelatedID, 
            @RelatedType, 
            @ActionURL, 
            GETDATE()
        );
        
        SELECT SCOPE_IDENTITY() AS NotificationID;
    END TRY
    BEGIN CATCH
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();
        
        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END
GO

PRINT 'Created stored procedure: [notifications].[sp_Notification_CreateUnified]';
GO
