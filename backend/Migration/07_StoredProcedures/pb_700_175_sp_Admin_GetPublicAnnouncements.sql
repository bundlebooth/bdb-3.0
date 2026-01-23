-- =============================================
-- Stored Procedure: admin.sp_GetPublicAnnouncements
-- Description: Gets active public announcements for display
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicAnnouncements]'))
    DROP PROCEDURE [admin].[sp_GetPublicAnnouncements];
GO

CREATE PROCEDURE [admin].[sp_GetPublicAnnouncements]
    @Audience NVARCHAR(50) = 'all'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Announcements' AND s.name = 'admin')
    BEGIN
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible
        FROM admin.Announcements
        WHERE IsActive = 1 
          AND (StartDate IS NULL OR StartDate <= GETDATE())
          AND (EndDate IS NULL OR EndDate >= GETDATE())
          AND (TargetAudience = @Audience OR TargetAudience = 'all')
        ORDER BY DisplayOrder;
        
        -- Update view count for returned announcements
        UPDATE admin.Announcements 
        SET ViewCount = ViewCount + 1 
        WHERE IsActive = 1 
          AND (StartDate IS NULL OR StartDate <= GETDATE())
          AND (EndDate IS NULL OR EndDate >= GETDATE())
          AND (TargetAudience = @Audience OR TargetAudience = 'all');
    END
    ELSE
    BEGIN
        SELECT NULL as AnnouncementID WHERE 1=0;
    END
END
GO
