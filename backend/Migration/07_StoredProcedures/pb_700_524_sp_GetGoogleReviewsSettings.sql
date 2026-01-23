/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetGoogleReviewsSettings]
*/

SET NOCOUNT ON;
GO

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
