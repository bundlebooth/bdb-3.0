-- =============================================
-- Stored Procedure: vendors.sp_GetVendorCompletionStatus
-- Description: Gets vendor profile completion status for email notifications
--              Uses SAME logic as SetupIncompleteBanner's isStepCompleted function
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorCompletionStatus]'))
    DROP PROCEDURE [vendors].[sp_GetVendorCompletionStatus];
GO

CREATE PROCEDURE [vendors].[sp_GetVendorCompletionStatus]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.UserID,
        vp.BusinessName,
        vp.BusinessEmail,
        vp.BusinessPhone,
        vp.DisplayName,
        vp.City,
        vp.State,
        vp.GooglePlaceId,
        vp.CancellationPolicy,
        (SELECT TOP 1 Category FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID AND IsPrimary = 1) AS PrimaryCategory,
        (SELECT COUNT(*) FROM vendors.VendorSelectedServices WHERE VendorProfileID = @VendorProfileID) AS ServiceCount,
        (SELECT COUNT(*) FROM vendors.Subcategories WHERE VendorProfileID = @VendorProfileID) AS SubcategoryCount,
        (SELECT COUNT(*) FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID AND URL IS NOT NULL AND URL != '') AS SocialMediaCount,
        (SELECT COUNT(*) FROM vendors.VendorFAQs WHERE VendorProfileID = @VendorProfileID) AS FAQCount,
        (SELECT COUNT(*) FROM vendors.VendorServiceAreas WHERE VendorProfileID = @VendorProfileID) AS ServiceAreaCount,
        (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID) AS ImageCount,
        (SELECT COUNT(*) FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1) AS AvailableDaysCount,
        CASE WHEN vp.IsPremium = 1 OR vp.IsEcoFriendly = 1 OR vp.IsAwardWinning = 1 OR vp.IsCertified = 1 OR vp.IsInsured = 1 THEN 1 ELSE 0 END AS HasBadges
    FROM vendors.VendorProfiles vp
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO

