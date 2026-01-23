/*
    Migration Script: Create Stored Procedure [vendors].[sp_Dashboard_GetSocialMedia]
*/

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia];
GO


    CREATE PROCEDURE [vendors].[sp_Dashboard_GetSocialMedia]
        @VendorProfileID INT
    AS
    BEGIN
        SET NOCOUNT ON;

        -- Social media profiles
        SELECT Platform, URL, DisplayOrder 
        FROM vendors.VendorSocialMedia 
        WHERE VendorProfileID = @VendorProfileID 
        ORDER BY DisplayOrder;
    END
  
GO
