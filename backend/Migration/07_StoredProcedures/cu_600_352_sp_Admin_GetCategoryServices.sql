-- =============================================
-- Stored Procedure: admin.sp_GetCategoryServices
-- Description: Gets services associated with a category
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetCategoryServices]'))
    DROP PROCEDURE [admin].[sp_GetCategoryServices];
GO

CREATE PROCEDURE [admin].[sp_GetCategoryServices]
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
    FROM vendors.VendorServices vs
    JOIN vendors.VendorProfiles vp ON vs.VendorProfileID = vp.VendorProfileID
    JOIN vendors.VendorCategories vc ON vp.VendorProfileID = vc.VendorProfileID
    WHERE vc.VendorCategoryID = @CategoryID OR @CategoryID IS NULL
    ORDER BY vs.ServiceName;
END
GO



