-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetSocialMedia
-- Description: Gets vendor social media and booking link
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Social media profiles
    SELECT Platform, URL, DisplayOrder FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
END
GO


