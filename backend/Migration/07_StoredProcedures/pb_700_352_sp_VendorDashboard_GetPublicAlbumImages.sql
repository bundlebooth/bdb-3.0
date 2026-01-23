-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetPublicAlbumImages
-- Description: Gets images for a public album
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetPublicAlbumImages]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetPublicAlbumImages];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetPublicAlbumImages]
    @AlbumID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PortfolioImageID,
        ImageURL,
        Caption,
        DisplayOrder,
        CreatedAt
    FROM vendors.VendorPortfolioImages
    WHERE AlbumID = @AlbumID
    ORDER BY DisplayOrder, CreatedAt;
END
GO

