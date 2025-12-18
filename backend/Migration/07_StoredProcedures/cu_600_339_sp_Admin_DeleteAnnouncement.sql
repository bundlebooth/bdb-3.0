-- =============================================
-- Stored Procedure: sp_Admin_DeleteAnnouncement
-- Description: Deletes an announcement
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteAnnouncement]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteAnnouncement];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteAnnouncement]
    @AnnouncementID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM Announcements WHERE AnnouncementID = @AnnouncementID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
