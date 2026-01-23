-- =============================================
-- Stored Procedure: vendors.sp_GetSocialMedia
-- Description: Gets social media for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_GetSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_GetSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Platform, URL, DisplayOrder
    FROM vendors.VendorSocialMedia
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END
GO

