-- =============================================
-- Stored Procedure: sp_Admin_GetBanners
-- Description: Gets all content banners
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetBanners]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetBanners];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetBanners]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'ContentBanners')
    BEGIN
        SELECT * FROM ContentBanners ORDER BY DisplayOrder, CreatedAt DESC;
    END
    ELSE
    BEGIN
        SELECT NULL as BannerID WHERE 1=0;
    END
END
GO
