-- =============================================
-- Stored Procedure: sp_Booking_GetVendorsByCategory
-- Description: Gets vendors by category for booking modal
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_GetVendorsByCategory]'))
    DROP PROCEDURE [dbo].[sp_Booking_GetVendorsByCategory];
GO

CREATE PROCEDURE [dbo].[sp_Booking_GetVendorsByCategory]
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
    FROM VendorCategories vc
    INNER JOIN VendorProfiles vp ON vc.VendorProfileID = vp.VendorProfileID
    WHERE vc.Category LIKE '%' + @Category + '%'
        AND vp.IsCompleted = 1
    ORDER BY vp.BusinessName;
END
GO
