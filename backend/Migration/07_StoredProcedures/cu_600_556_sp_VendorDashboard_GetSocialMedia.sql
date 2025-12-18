-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetSocialMedia
-- Description: Gets vendor social media and booking link
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First recordset: Social media profiles
    SELECT Platform, URL, DisplayOrder FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID ORDER BY DisplayOrder;
    
    -- Second recordset: Booking link
    SELECT BookingLink FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO


