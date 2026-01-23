/*
    Migration Script: Create Stored Procedure [admin].[sp_GetAllPublicAnnouncements]
    Description: Creates the [admin].[sp_GetAllPublicAnnouncements] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAllPublicAnnouncements]'))
    DROP PROCEDURE [admin].[sp_GetAllPublicAnnouncements];
GO


CREATE PROCEDURE [admin].[sp_GetAllPublicAnnouncements]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Announcements' AND s.name = 'admin')
    BEGIN
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible, StartDate, EndDate, CreatedAt
        FROM admin.Announcements
        WHERE IsActive = 1 
            AND (EndDate IS NULL OR CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE))
        ORDER BY DisplayOrder, CreatedAt DESC;
    END
END
GO
