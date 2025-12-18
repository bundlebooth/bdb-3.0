-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetSetupStatus
-- Description: Gets vendor setup status and counts
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetSetupStatus]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetSetupStatus];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetSetupStatus]
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
    FROM VendorProfiles 
    WHERE UserID = @UserID;
    
    -- Get counts for setup status
    DECLARE @VendorProfileID INT;
    SELECT @VendorProfileID = VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;
    
    IF @VendorProfileID IS NOT NULL
    BEGIN
        SELECT
            (SELECT COUNT(*) FROM VendorCategories WHERE VendorProfileID = @VendorProfileID) AS CategoriesCount,
            (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = @VendorProfileID) AS ImagesCount,
            (SELECT COUNT(*) FROM Services s JOIN ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID = @VendorProfileID AND s.IsActive = 1) AS ServicesCount,
            (SELECT COUNT(*) FROM Packages WHERE VendorProfileID = @VendorProfileID) AS PackageCount,
            (SELECT COUNT(*) FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID AND (IsActive = 1 OR IsActive IS NULL)) AS FAQCount,
            (SELECT COUNT(*) FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID) AS CategoryAnswerCount,
            (SELECT COUNT(*) FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialCount,
            (SELECT COUNT(*) FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1) AS HoursCount,
            (SELECT COUNT(*) FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID AND IsActive = 1) AS ServiceAreaCount;
    END
END
GO
