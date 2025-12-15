/*
    Migration Script: Create Stored Procedure [sp_UpsertContentBanner]
    Phase: 600 - Stored Procedures
    Script: cu_600_113_dbo.sp_UpsertContentBanner.sql
    Description: Creates the [dbo].[sp_UpsertContentBanner] stored procedure
    
    Execution Order: 113
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpsertContentBanner]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertContentBanner]'))
    DROP PROCEDURE [dbo].[sp_UpsertContentBanner];
GO

CREATE   PROCEDURE [dbo].[sp_UpsertContentBanner]
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

PRINT 'Stored procedure [dbo].[sp_UpsertContentBanner] created successfully.';
GO
