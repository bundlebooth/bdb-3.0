-- =============================================
-- Stored Procedure: vendors.sp_InsertSocialMedia
-- Description: Inserts a social media entry for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_InsertSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_InsertSocialMedia]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(255),
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO vendors.VendorSocialMedia (VendorProfileID, Platform, URL, DisplayOrder)
    VALUES (@VendorProfileID, @Platform, @URL, @DisplayOrder);
    
    SELECT SCOPE_IDENTITY() AS SocialMediaID;
END
GO

