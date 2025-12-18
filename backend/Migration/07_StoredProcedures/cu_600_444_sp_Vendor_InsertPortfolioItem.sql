-- =============================================
-- Stored Procedure: sp_Vendor_InsertPortfolioItem
-- Description: Inserts a portfolio item for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertPortfolioItem]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertPortfolioItem];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertPortfolioItem]
    @VendorProfileID INT,
    @Title NVARCHAR(255),
    @Description NVARCHAR(MAX) = NULL,
    @ImageURL NVARCHAR(500),
    @ProjectDate DATE = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorPortfolio (VendorProfileID, Title, Description, ImageURL, ProjectDate, DisplayOrder)
    VALUES (@VendorProfileID, @Title, @Description, @ImageURL, @ProjectDate, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS PortfolioID;
END
GO
