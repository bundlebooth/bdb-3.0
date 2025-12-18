-- =============================================
-- Stored Procedure: sp_Vendor_InsertSocialMediaWithOrder
-- Description: Inserts a social media entry with display order
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertSocialMediaWithOrder]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertSocialMediaWithOrder];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertSocialMediaWithOrder]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO
