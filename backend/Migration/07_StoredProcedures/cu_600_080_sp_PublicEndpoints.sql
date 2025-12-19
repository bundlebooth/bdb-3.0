/*
    Migration Script: Create Stored Procedures for Public Endpoints
    Phase: 600 - Stored Procedures
    Script: cu_600_080_sp_PublicEndpoints.sql
    Description: Creates stored procedures for public API endpoints (announcements, banners, FAQs, commission)
    Schema: public
    Execution Order: 80
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedures for public endpoints...';
GO

-- =============================================
-- sp_GetAnnouncements
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicAnnouncements]'))
    DROP PROCEDURE [admin].[sp_GetPublicAnnouncements];
GO

CREATE PROCEDURE [admin].[sp_GetPublicAnnouncements]
    @Audience NVARCHAR(50) = 'all'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Announcements' AND s.name = 'admin')
    BEGIN
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible, CreatedAt
        FROM admin.Announcements
        WHERE IsActive = 1 
            AND (StartDate IS NULL OR CAST(StartDate AS DATE) <= CAST(GETDATE() AS DATE)) 
            AND (EndDate IS NULL OR CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE))
            AND (TargetAudience = 'all' OR TargetAudience = @Audience)
        ORDER BY DisplayOrder, CreatedAt DESC;
    END
END
GO

-- =============================================
-- sp_GetAllAnnouncements
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAllPublicAnnouncements]'))
    DROP PROCEDURE [admin].[sp_GetAllPublicAnnouncements];
GO

CREATE PROCEDURE [admin].[sp_GetAllPublicAnnouncements]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'Announcements' AND s.name = 'admin')
    BEGIN
        SELECT AnnouncementID, Title, Content, Type, Icon, LinkURL, LinkText, DisplayType, IsDismissible, StartDate, EndDate, CreatedAt
        FROM admin.Announcements
        WHERE IsActive = 1 
            AND (EndDate IS NULL OR CAST(EndDate AS DATE) >= CAST(GETDATE() AS DATE))
        ORDER BY DisplayOrder, CreatedAt DESC;
    END
END
GO

-- =============================================
-- sp_GetBanners
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicBanners]'))
    DROP PROCEDURE [admin].[sp_GetPublicBanners];
GO

CREATE PROCEDURE [admin].[sp_GetPublicBanners]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ContentBanners')
    BEGIN
        SELECT BannerID, Title, Subtitle, ImageURL, LinkURL, LinkText, BackgroundColor, TextColor, Position
        FROM ContentBanners
        WHERE IsActive = 1 
            AND (StartDate IS NULL OR StartDate <= GETUTCDATE()) 
            AND (EndDate IS NULL OR EndDate >= GETUTCDATE())
        ORDER BY DisplayOrder, CreatedAt DESC;
    END
END
GO

-- =============================================
-- sp_DismissAnnouncement
-- =============================================
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

-- =============================================
-- sp_GetFAQs
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicFAQs]'))
    DROP PROCEDURE [admin].[sp_GetPublicFAQs];
GO

CREATE PROCEDURE [admin].[sp_GetPublicFAQs]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables t JOIN sys.schemas s ON t.schema_id = s.schema_id WHERE t.name = 'FAQs' AND s.name = 'admin')
    BEGIN
        SELECT FAQID, Question, Answer, Category
        FROM admin.FAQs
        WHERE IsActive = 1
        ORDER BY DisplayOrder, CreatedAt;
    END
END
GO

-- =============================================
-- sp_SubmitFAQFeedback
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SubmitPublicFAQFeedback]'))
    DROP PROCEDURE [admin].[sp_SubmitPublicFAQFeedback];
GO

CREATE PROCEDURE [admin].[sp_SubmitPublicFAQFeedback]
    @FAQID INT,
    @UserID INT = NULL,
    @Rating NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Table should already exist from migrations, but check just in case
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FAQFeedback')
    BEGIN
        INSERT INTO FAQFeedback (FAQID, UserID, Rating, CreatedAt)
        VALUES (@FAQID, @UserID, @Rating, GETDATE());
    END
END
GO

-- =============================================
-- sp_GetCommissionInfo
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicCommissionInfo]'))
    DROP PROCEDURE [admin].[sp_GetPublicCommissionInfo];
GO

CREATE PROCEDURE [admin].[sp_GetPublicCommissionInfo]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings')
    BEGIN
        SELECT SettingKey, SettingValue, Description
        FROM CommissionSettings
        WHERE IsActive = 1;
    END
END
GO

PRINT 'Public endpoint stored procedures created successfully.';
GO
