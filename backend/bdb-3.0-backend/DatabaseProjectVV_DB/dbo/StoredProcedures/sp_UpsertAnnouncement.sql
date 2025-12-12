
-- Upsert announcement
CREATE   PROCEDURE sp_UpsertAnnouncement
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
        INSERT INTO Announcements (Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, TargetAudience, StartDate, EndDate, IsActive, IsDismissible, DisplayOrder, CreatedBy)
        VALUES (@Title, @Content, @Type, @Icon, @LinkURL, @LinkText, @DisplayType, @TargetAudience, @StartDate, @EndDate, @IsActive, @IsDismissible, @DisplayOrder, @UserID);
        
        SELECT SCOPE_IDENTITY() AS AnnouncementID;
    END
    ELSE
    BEGIN
        UPDATE Announcements
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

