-- =============================================
-- Stored Procedure: admin.sp_DeleteBanner
-- Description: Deletes a content banner
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_DeleteBanner]'))
    DROP PROCEDURE [admin].[sp_DeleteBanner];
GO

CREATE PROCEDURE [admin].[sp_DeleteBanner]
    @BannerID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM ContentBanners WHERE BannerID = @BannerID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
