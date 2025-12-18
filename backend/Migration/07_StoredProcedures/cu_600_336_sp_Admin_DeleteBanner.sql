-- =============================================
-- Stored Procedure: sp_Admin_DeleteBanner
-- Description: Deletes a content banner
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_DeleteBanner]'))
    DROP PROCEDURE [dbo].[sp_Admin_DeleteBanner];
GO

CREATE PROCEDURE [dbo].[sp_Admin_DeleteBanner]
    @BannerID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    DELETE FROM ContentBanners WHERE BannerID = @BannerID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
