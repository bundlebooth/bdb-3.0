-- =============================================
-- Stored Procedure: sp_Admin_GetCategoryServices
-- Description: Gets services associated with a category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetCategoryServices]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetCategoryServices];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetCategoryServices]
    @CategoryID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        vs.ServiceID,
        vs.ServiceName,
        vs.Description,
        vs.BasePrice,
        vs.PriceType,
        vs.Duration,
        vs.IsActive,
        vp.BusinessName as VendorName,
        vp.VendorProfileID
    FROM VendorServices vs
    JOIN VendorProfiles vp ON vs.VendorProfileID = vp.VendorProfileID
    JOIN VendorCategories vc ON vp.VendorProfileID = vc.VendorProfileID
    WHERE vc.VendorCategoryID = @CategoryID OR @CategoryID IS NULL
    ORDER BY vs.ServiceName;
END
GO
