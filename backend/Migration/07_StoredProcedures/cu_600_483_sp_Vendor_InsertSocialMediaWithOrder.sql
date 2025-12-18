-- =============================================
-- Stored Procedure: vendors.sp_InsertSocialMediaWithOrder
-- Description: Inserts a social media entry with display order
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertSocialMediaWithOrder]'))
    DROP PROCEDURE [vendors].[sp_InsertSocialMediaWithOrder];
GO

CREATE PROCEDURE [vendors].[sp_InsertSocialMediaWithOrder]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO

