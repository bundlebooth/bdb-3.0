-- =============================================
-- Stored Procedure: bookings.sp_GetVendorsByCategory
-- Description: Gets vendors by category for booking modal
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_GetVendorsByCategory]'))
    DROP PROCEDURE [bookings].[sp_GetVendorsByCategory];
GO

CREATE PROCEDURE [bookings].[sp_GetVendorsByCategory]
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DISTINCT
        vp.VendorProfileID,
        vp.BusinessName,
        vp.BusinessDescription,
        vp.PriceLevel,
        vc.Category
    FROM vendors.VendorCategories vc
    INNER JOIN vendors.VendorProfiles vp ON vc.VendorProfileID = vp.VendorProfileID
    WHERE vc.Category LIKE '%' + @Category + '%'
        AND vp.IsCompleted = 1
    ORDER BY vp.BusinessName;
END
GO


