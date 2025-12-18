-- =============================================
-- Stored Procedure: sp_Admin_GetAnnouncements
-- Description: Gets all announcements
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetAnnouncements]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetAnnouncements];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetAnnouncements]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'Announcements')
    BEGIN
        SELECT * FROM Announcements ORDER BY DisplayOrder, CreatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT NULL as AnnouncementID WHERE 1=0;
    END
END
GO
