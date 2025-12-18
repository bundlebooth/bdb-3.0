-- =============================================
-- Stored Procedure: sp_VendorDashboard_CheckAlbumPublic
-- Description: Checks if album is public
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_CheckAlbumPublic]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_CheckAlbumPublic];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_CheckAlbumPublic]
    @AlbumID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPublic FROM VendorPortfolioAlbums 
    WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID;
END
GO
