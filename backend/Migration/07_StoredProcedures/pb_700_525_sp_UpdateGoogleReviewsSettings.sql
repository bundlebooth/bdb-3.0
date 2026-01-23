/*
    Migration Script: Create Stored Procedure [vendors].[sp_UpdateGoogleReviewsSettings]
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateGoogleReviewsSettings]'))
    DROP PROCEDURE [vendors].[sp_UpdateGoogleReviewsSettings];
GO


CREATE PROCEDURE [vendors].[sp_UpdateGoogleReviewsSettings]
    @VendorProfileID INT,
    @GooglePlaceId NVARCHAR(100) = NULL,
    @GoogleBusinessUrl NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET GooglePlaceId = @GooglePlaceId,
        GoogleBusinessUrl = @GoogleBusinessUrl
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
