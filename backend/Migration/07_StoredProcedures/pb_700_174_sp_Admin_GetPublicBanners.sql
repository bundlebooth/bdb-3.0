-- =============================================
-- Stored Procedure: admin.sp_GetPublicBanners
-- Description: Gets active public banners for display
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

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
          AND (StartDate IS NULL OR StartDate <= GETDATE())
          AND (EndDate IS NULL OR EndDate >= GETDATE())
        ORDER BY DisplayOrder;
    END
    ELSE
    BEGIN
        SELECT NULL as BannerID WHERE 1=0;
    END
END
GO
