-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetPublicAlbumImages
-- Description: Gets images for a public album
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetPublicAlbumImages]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetPublicAlbumImages];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetPublicAlbumImages]
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
    FROM VendorPortfolioImages
    WHERE AlbumID = @AlbumID
    ORDER BY DisplayOrder, CreatedAt;
END
GO
