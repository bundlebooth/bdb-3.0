-- =============================================
-- Stored Procedure: vendors.sp_GetSetupProgressSummary
-- Description: Gets vendor setup progress summary with counts
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSetupProgressSummary]'))
    DROP PROCEDURE [vendors].[sp_GetSetupProgressSummary];
GO

CREATE PROCEDURE [vendors].[sp_GetSetupProgressSummary]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        v.IsCompleted,
        v.BusinessName,
        v.BusinessEmail,
        v.BusinessPhone,
        v.Address,
        v.LogoURL,
        v.AcceptingBookings,
        (SELECT COUNT(*) FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID) as CategoriesCount,
        (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID) as ImagesCount,
        (SELECT COUNT(*) FROM vendors.Services WHERE CategoryID IN (SELECT CategoryID FROM vendors.ServiceCategories WHERE VendorProfileID = @VendorProfileID)) as ServicesCount,
        (SELECT COUNT(*) FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) as SocialMediaCount,
        (SELECT COUNT(*) FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) as BusinessHoursCount
    FROM vendors.VendorProfiles v
    WHERE v.VendorProfileID = @VendorProfileID;
END
GO





