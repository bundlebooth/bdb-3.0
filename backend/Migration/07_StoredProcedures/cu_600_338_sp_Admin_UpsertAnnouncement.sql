-- =============================================
-- Stored Procedure: admin.sp_UpsertAnnouncement
-- Description: Creates or updates an announcement
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpsertAnnouncement]'))
    DROP PROCEDURE [admin].[sp_UpsertAnnouncement];
GO

CREATE PROCEDURE [admin].[sp_UpsertAnnouncement]
    @AnnouncementID INT = NULL,
    @Title NVARCHAR(255),
    @Content NVARCHAR(MAX),
    @Type NVARCHAR(50) = 'info',
    @Icon NVARCHAR(100) = NULL,
    @LinkURL NVARCHAR(500) = NULL,
    @LinkText NVARCHAR(100) = NULL,
    @DisplayType NVARCHAR(50) = 'banner',
    @TargetAudience NVARCHAR(50) = 'all',
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @IsActive BIT = 1,
    @IsDismissible BIT = 1,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @AnnouncementID IS NOT NULL
    BEGIN
        UPDATE admin.Announcements SET
            Title = @Title, Content = @Content, Type = @Type, Icon = @Icon,
            LinkURL = @LinkURL, LinkText = @LinkText, DisplayType = @DisplayType,
            TargetAudience = @TargetAudience, StartDate = @StartDate, EndDate = @EndDate,
            IsActive = @IsActive, IsDismissible = @IsDismissible, DisplayOrder = @DisplayOrder, UpdatedAt = GETUTCDATE()
        WHERE AnnouncementID = @AnnouncementID;
        
        SELECT @AnnouncementID AS AnnouncementID;
    END
    ELSE
    BEGIN
        INSERT INTO admin.Announcements (Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, TargetAudience, StartDate, EndDate, IsActive, IsDismissible, DisplayOrder)
        OUTPUT INSERTED.AnnouncementID
        VALUES (@Title, @Content, @Type, @Icon, @LinkURL, @LinkText, @DisplayType, @TargetAudience, @StartDate, @EndDate, @IsActive, @IsDismissible, @DisplayOrder);
    END
END
GO
