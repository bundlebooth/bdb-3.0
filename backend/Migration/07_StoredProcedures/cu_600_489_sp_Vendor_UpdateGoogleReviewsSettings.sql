-- =============================================
-- Stored Procedure: sp_Vendor_UpdateGoogleReviewsSettings
-- Description: Updates Google Reviews settings for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateGoogleReviewsSettings]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateGoogleReviewsSettings];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateGoogleReviewsSettings]
    @VendorProfileID INT,
    @GooglePlaceId NVARCHAR(100) = NULL,
    @GoogleBusinessUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles
    SET GooglePlaceId = @GooglePlaceId,
        GoogleBusinessUrl = @GoogleBusinessUrl
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
