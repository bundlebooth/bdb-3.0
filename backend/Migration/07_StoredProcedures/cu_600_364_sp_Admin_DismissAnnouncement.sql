-- =============================================
-- Stored Procedure: sp_Admin_DismissAnnouncement
-- Description: Increments dismiss count for an announcement
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DismissAnnouncement]'))
    DROP PROCEDURE [dbo].[sp_Admin_DismissAnnouncement];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DismissAnnouncement]
    @AnnouncementID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Announcements SET DismissCount = DismissCount + 1 WHERE AnnouncementID = @AnnouncementID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
