-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertSocialMedia
-- Description: Inserts a social media profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertSocialMedia]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertSocialMedia];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertSocialMedia]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO
