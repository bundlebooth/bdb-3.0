/*
    Migration Script: Create Stored Procedure [admin].[sp_DismissPublicAnnouncement]
    Description: Creates the [admin].[sp_DismissPublicAnnouncement] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DismissPublicAnnouncement]'))
    DROP PROCEDURE [admin].[sp_DismissPublicAnnouncement];
GO


CREATE PROCEDURE [admin].[sp_DismissPublicAnnouncement]
    @AnnouncementID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE admin.Announcements 
    SET DismissCount = ISNULL(DismissCount, 0) + 1 
    WHERE AnnouncementID = @AnnouncementID;
END
GO
