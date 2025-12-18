-- =============================================
-- Stored Procedure: vendors.sp_GetGoogleReviewsSettings
-- Description: Gets Google Reviews settings for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetGoogleReviewsSettings]'))
    DROP PROCEDURE [vendors].[sp_GetGoogleReviewsSettings];
GO

CREATE PROCEDURE [vendors].[sp_GetGoogleReviewsSettings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT GooglePlaceId, GoogleBusinessUrl
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO

