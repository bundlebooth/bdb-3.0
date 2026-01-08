-- =============================================
-- Stored Procedure: vendors.sp_GetSetupCounts
-- Description: Gets counts for vendor setup status calculation
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSetupCounts]'))
    DROP PROCEDURE [vendors].[sp_GetSetupCounts];
GO

CREATE PROCEDURE [vendors].[sp_GetSetupCounts]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
      (SELECT COUNT(*) FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID) AS CategoriesCount,
      (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = @VendorProfileID) AS ImagesCount,
      (SELECT COUNT(*) FROM vendors.Services s JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID WHERE sc.VendorProfileID=@VendorProfileID AND s.IsActive=1) AS ServicesCount,
      (SELECT COUNT(*) FROM Packages WHERE VendorProfileID = @VendorProfileID) AS PackageCount,
      (SELECT COUNT(*) FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID AND (IsActive = 1 OR IsActive IS NULL)) AS FAQCount,
      (SELECT COUNT(*) FROM VendorCategoryAnswers WHERE VendorProfileID = @VendorProfileID) AS CategoryAnswerCount,
      (SELECT COUNT(*) FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID) AS SocialCount,
      (SELECT COUNT(*) FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND IsAvailable = 1) AS HoursCount,
      (SELECT COUNT(*) FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID AND IsActive = 1) AS ServiceAreaCount;
END
GO




