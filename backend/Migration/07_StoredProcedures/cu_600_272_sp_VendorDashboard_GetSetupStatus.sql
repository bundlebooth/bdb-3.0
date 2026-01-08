-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetSetupStatus
-- Description: Gets vendor setup status and counts
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetSetupStatus]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetSetupStatus];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetSetupStatus]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile
    SELECT 
        VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, LogoURL,
        DepositRequirements, PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified,
        IsVerified, IsCompleted, AcceptingBookings, GooglePlaceID,
        IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured,
        StripeAccountID
    FROM vendors.VendorProfiles 
    WHERE UserID = @UserID;
    
    -- Get counts for setup status
    DECLARE @VendorProfileID INT;
    SELECT @VendorProfileID = VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID;
    
    IF @VendorProfileID IS NOT NULL
    BEGIN
        SELECT
            (SELECT COUNT(*) FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID) AS CategoriesCount,
            (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID) AS ImagesCount,
            (SELECT COUNT(*) FROM vendors.Services s JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = @VendorProfileID AND s.IsActive = 1) AS ServicesCount,
            (SELECT COUNT(*) FROM Packages WHERE VendorProfileID = @VendorProfileID) AS PackageCount,
            (SELECT COUNT(*) FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID AND (IsActive = 1 OR IsActive IS NULL)) AS FAQCount,
            (SELECT COUNT(*) FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID) AS CategoryAnswerCount,
            (SELECT COUNT(*) FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialCount,
            (SELECT COUNT(*) FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1) AS HoursCount,
            (SELECT COUNT(*) FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID AND IsActive = 1) AS ServiceAreaCount;
    END
END
GO





