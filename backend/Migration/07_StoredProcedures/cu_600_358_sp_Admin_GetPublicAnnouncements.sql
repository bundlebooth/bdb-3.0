-- =============================================
-- Stored Procedure: sp_Admin_GetPublicAnnouncements
-- Description: Gets active public announcements for display
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPublicAnnouncements]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPublicAnnouncements];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPublicAnnouncements]
    @Audience NVARCHAR(50) = 'all'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Announcements')
    BEGIN
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible
        FROM Announcements
        WHERE IsActive = 1 
          AND (StartDate IS NULL OR StartDate <= GETDATE())
          AND (EndDate IS NULL OR EndDate >= GETDATE())
          AND (TargetAudience = @Audience OR TargetAudience = 'all')
        ORDER BY DisplayOrder;
        
        -- Update view count for returned announcements
        UPDATE Announcements 
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
