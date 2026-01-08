-- =============================================
-- Stored Procedure: admin.sp_DismissAnnouncement
-- Description: Increments dismiss count for an announcement
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DismissAnnouncement]'))
    DROP PROCEDURE [admin].[sp_DismissAnnouncement];
GO

CREATE PROCEDURE [admin].[sp_DismissAnnouncement]
    @AnnouncementID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE Announcements SET DismissCount = DismissCount + 1 WHERE AnnouncementID = @AnnouncementID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
