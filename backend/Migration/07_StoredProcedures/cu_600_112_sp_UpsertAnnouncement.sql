/*
    Migration Script: Create Stored Procedure [sp_UpsertAnnouncement]
    Phase: 600 - Stored Procedures
    Script: cu_600_112_dbo.sp_UpsertAnnouncement.sql
    Description: Creates the [admin].[sp_UpsertAnnouncement] stored procedure
    
    Execution Order: 112
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_UpsertAnnouncement]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpsertAnnouncement]'))
    DROP PROCEDURE [admin].[sp_UpsertAnnouncement];
GO

CREATE   PROCEDURE [admin].[sp_UpsertAnnouncement]
    @AnnouncementID INT = NULL,
    @Title NVARCHAR(200),
    @Content NVARCHAR(MAX),
    @Type NVARCHAR(50) = 'info',
    @Icon NVARCHAR(50) = NULL,
    @LinkURL NVARCHAR(500) = NULL,
    @LinkText NVARCHAR(100) = NULL,
    @DisplayType NVARCHAR(50) = 'banner',
    @TargetAudience NVARCHAR(50) = 'all',
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @IsActive BIT = 1,
    @IsDismissible BIT = 1,
    @DisplayOrder INT = 0,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @AnnouncementID IS NULL
    BEGIN
        INSERT INTO admin.Announcements (Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, TargetAudience, StartDate, EndDate, IsActive, IsDismissible, DisplayOrder, CreatedBy)
        VALUES (@Title, @Content, @Type, @Icon, @LinkURL, @LinkText, @DisplayType, @TargetAudience, @StartDate, @EndDate, @IsActive, @IsDismissible, @DisplayOrder, @UserID);
        
        SELECT SCOPE_IDENTITY() AS AnnouncementID;
    END
    ELSE
    BEGIN
        UPDATE admin.Announcements
        SET Title = @Title,
            Content = @Content,
            Type = @Type,
            Icon = @Icon,
            LinkURL = @LinkURL,
            LinkText = @LinkText,
            DisplayType = @DisplayType,
            TargetAudience = @TargetAudience,
            StartDate = @StartDate,
            EndDate = @EndDate,
            IsActive = @IsActive,
            IsDismissible = @IsDismissible,
            DisplayOrder = @DisplayOrder,
            UpdatedAt = GETUTCDATE()
        WHERE AnnouncementID = @AnnouncementID;
        
        SELECT @AnnouncementID AS AnnouncementID;
    END
END;
GO

PRINT 'Stored procedure [admin].[sp_UpsertAnnouncement] created successfully.';
GO
