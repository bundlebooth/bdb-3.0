-- =============================================
-- Stored Procedure: sp_Vendor_InsertSocialMedia
-- Description: Inserts a social media entry for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertSocialMedia]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertSocialMedia];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertSocialMedia]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(255),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO
