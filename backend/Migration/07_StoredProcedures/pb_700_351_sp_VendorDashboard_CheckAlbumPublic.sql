-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_CheckAlbumPublic
-- Description: Checks if album is public
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_CheckAlbumPublic]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_CheckAlbumPublic];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_CheckAlbumPublic]
    @AlbumID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT IsPublic FROM vendors.VendorPortfolioAlbums 
    WHERE AlbumID = @AlbumID AND VendorProfileID = @VendorProfileID;
END
GO
