-- =============================================
-- Stored Procedure: vendors.sp_InsertPortfolioItem
-- Description: Inserts a portfolio item for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertPortfolioItem]'))
    DROP PROCEDURE [vendors].[sp_InsertPortfolioItem];
GO

CREATE PROCEDURE [vendors].[sp_InsertPortfolioItem]
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
