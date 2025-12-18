-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_InsertSocialMedia
-- Description: Inserts a social media profile
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_InsertSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_InsertSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_InsertSocialMedia]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO

