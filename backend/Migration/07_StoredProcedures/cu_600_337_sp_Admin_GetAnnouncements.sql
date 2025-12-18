-- =============================================
-- Stored Procedure: admin.sp_GetAnnouncements
-- Description: Gets all announcements
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAnnouncements]'))
    DROP PROCEDURE [admin].[sp_GetAnnouncements];
GO

CREATE PROCEDURE [admin].[sp_GetAnnouncements]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Announcements' AND s.name = 'admin')
    BEGIN
        SELECT * FROM admin.Announcements ORDER BY DisplayOrder, CreatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT NULL as AnnouncementID WHERE 1=0;
    END
END
GO
