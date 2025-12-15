-- =============================================
-- Stored Procedure: sp_GetVendorSetupCounts
-- Description: Gets vendor setup counts for various entities
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorSetupCounts]'))
    DROP PROCEDURE [dbo].[sp_GetVendorSetupCounts];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorSetupCounts]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
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
GO
