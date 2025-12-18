-- =============================================
-- Stored Procedure: sp_Vendor_GetGoogleReviewsSettings
-- Description: Gets Google Reviews settings for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetGoogleReviewsSettings]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetGoogleReviewsSettings];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetGoogleReviewsSettings]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT GooglePlaceId, GoogleBusinessUrl
    FROM VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO
