-- =============================================
-- Stored Procedure: vendors.sp_GetPendingReviews
-- Description: Gets all pending vendor profiles for admin review
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPendingReviews]'))
    DROP PROCEDURE [vendors].[sp_GetPendingReviews];
GO

CREATE PROCEDURE [vendors].[sp_GetPendingReviews]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription,
        vp.BusinessPhone,
        vp.BusinessEmail,
        vp.Website,
        vp.City,
        vp.State,
        vp.Country,
        vp.ProfileStatus,
        vp.SubmittedForReviewAt,
        vp.CreatedAt,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        (SELECT TOP 1 ImageURL FROM vendors.VendorImages WHERE VendorProfileID = vp.VendorProfileID ORDER BY IsPrimary DESC, DisplayOrder ASC) as PrimaryImage,
        (SELECT STRING_AGG(Category, ', ') FROM vendors.VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE vp.ProfileStatus = 'pending_review'
    ORDER BY vp.SubmittedForReviewAt ASC;
END
GO




