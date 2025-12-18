-- =============================================
-- Stored Procedure: sp_Vendor_GetSetupProgressSummary
-- Description: Gets vendor setup progress summary with counts
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetSetupProgressSummary]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetSetupProgressSummary];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetSetupProgressSummary]
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
        (SELECT COUNT(*) FROM VendorCategories WHERE VendorProfileID = @VendorProfileID) as CategoriesCount,
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) as ImagesCount,
        (SELECT COUNT(*) FROM Services WHERE CategoryID IN (SELECT CategoryID FROM ServiceCategories WHERE VendorProfileID = @VendorProfileID)) as ServicesCount,
        (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) as SocialMediaCount,
        (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID) as BusinessHoursCount
    FROM VendorProfiles v
    WHERE v.VendorProfileID = @VendorProfileID;
END
GO
