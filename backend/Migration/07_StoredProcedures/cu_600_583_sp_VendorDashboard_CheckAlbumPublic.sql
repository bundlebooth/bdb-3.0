-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_CheckAlbumPublic
-- Description: Checks if album is public
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_CheckAlbumPublic]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_CheckAlbumPublic];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_CheckAlbumPublic]
    @AlbumID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPublic FROM VendorPortfolioAlbums 
    WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID;
END
GO
