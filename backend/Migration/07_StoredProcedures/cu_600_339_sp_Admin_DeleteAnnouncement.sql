-- =============================================
-- Stored Procedure: admin.sp_DeleteAnnouncement
-- Description: Deletes an announcement
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteAnnouncement]'))
    DROP PROCEDURE [admin].[sp_DeleteAnnouncement];
GO

CREATE PROCEDURE [admin].[sp_DeleteAnnouncement]
    @AnnouncementID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM admin.Announcements WHERE AnnouncementID = @AnnouncementID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
