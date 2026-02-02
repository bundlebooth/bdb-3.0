-- =============================================
-- Stored Procedure: admin.sp_GetAllNotifications
-- Description: Gets ALL user notifications consolidated for admin dashboard
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAllNotifications]'))
    DROP PROCEDURE [admin].[sp_GetAllNotifications];
GO

CREATE PROCEDURE [admin].[sp_GetAllNotifications]
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        n.NotificationID,
        n.UserID,
        CONCAT(u.FirstName, ' ', ISNULL(u.LastName, '')) as UserName,
        u.Email as UserEmail,
        n.Title,
        n.Message,
        n.Type,
        n.IsRead,
        n.ReadAt,
        n.RelatedID,
        n.RelatedType,
        n.ActionURL,
        n.CreatedAt
    FROM notifications.Notifications n
    LEFT JOIN users.Users u ON n.UserID = u.UserID
    ORDER BY n.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Total count
    SELECT COUNT(*) as total FROM notifications.Notifications;
END
GO
