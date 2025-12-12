
-- Upsert content banner
CREATE   PROCEDURE sp_UpsertContentBanner
    @BannerID INT = NULL,
    @Title NVARCHAR(200),
    @Subtitle NVARCHAR(500) = NULL,
    @ImageURL NVARCHAR(500) = NULL,
    @LinkURL NVARCHAR(500) = NULL,
    @LinkText NVARCHAR(100) = NULL,
    @BackgroundColor NVARCHAR(20) = NULL,
    @TextColor NVARCHAR(20) = NULL,
    @Position NVARCHAR(50) = 'hero',
    @DisplayOrder INT = 0,
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @IsActive BIT = 1,
    @UserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @BannerID IS NULL
    BEGIN
        INSERT INTO ContentBanners (Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position, DisplayOrder, StartDate, EndDate, IsActive, CreatedBy)
        VALUES (@Title, @Subtitle, @ImageURL, @LinkURL, @LinkText, @BackgroundColor, @TextColor, @Position, @DisplayOrder, @StartDate, @EndDate, @IsActive, @UserID);
        
        SELECT SCOPE_IDENTITY() AS BannerID;
    END
    ELSE
    BEGIN
        UPDATE ContentBanners
        SET Title = @Title,
            Subtitle = @Subtitle,
            ImageURL = @ImageURL,
            LinkURL = @LinkURL,
            LinkText = @LinkText,
            BackgroundColor = @BackgroundColor,
            TextColor = @TextColor,
            Position = @Position,
            DisplayOrder = @DisplayOrder,
            StartDate = @StartDate,
            EndDate = @EndDate,
            IsActive = @IsActive,
            UpdatedAt = GETUTCDATE()
        WHERE BannerID = @BannerID;
        
        SELECT @BannerID AS BannerID;
    END
END;

GO

