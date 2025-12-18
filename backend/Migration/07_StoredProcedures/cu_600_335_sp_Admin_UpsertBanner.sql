-- =============================================
-- Stored Procedure: admin.sp_UpsertBanner
-- Description: Creates or updates a content banner
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpsertBanner]'))
    DROP PROCEDURE [admin].[sp_UpsertBanner];
GO

CREATE PROCEDURE [admin].[sp_UpsertBanner]
    @BannerID INT = NULL,
    @Title NVARCHAR(255),
    @Subtitle NVARCHAR(500) = NULL,
    @ImageURL NVARCHAR(500) = NULL,
    @LinkURL NVARCHAR(500) = NULL,
    @LinkText NVARCHAR(100) = NULL,
    @BackgroundColor NVARCHAR(50) = NULL,
    @TextColor NVARCHAR(50) = NULL,
    @Position NVARCHAR(50) = 'hero',
    @DisplayOrder INT = 0,
    @StartDate DATETIME2 = NULL,
    @EndDate DATETIME2 = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @BannerID IS NOT NULL
    BEGIN
        UPDATE ContentBanners SET
            Title = @Title, Subtitle = @Subtitle, ImageURL = @ImageURL,
            LinkURL = @LinkURL, LinkText = @LinkText, BackgroundColor = @BackgroundColor,
            TextColor = @TextColor, Position = @Position, DisplayOrder = @DisplayOrder,
            StartDate = @StartDate, EndDate = @EndDate, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
        WHERE BannerID = @BannerID;
        
        SELECT @BannerID AS BannerID;
    END
    ELSE
    BEGIN
        INSERT INTO ContentBanners (Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position, DisplayOrder, StartDate, EndDate, IsActive)
        OUTPUT INSERTED.BannerID
        VALUES (@Title, @Subtitle, @ImageURL, @LinkURL, @LinkText, @BackgroundColor, @TextColor, @Position, @DisplayOrder, @StartDate, @EndDate, @IsActive);
    END
END
GO
