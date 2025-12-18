-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetSocialMedia
-- Description: Gets vendor social media and booking link
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetSocialMedia]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetSocialMedia];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First recordset: Social media profiles
    SELECT Platform, URL, DisplayOrder FROM VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Second recordset: Booking link
    SELECT BookingLink FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
