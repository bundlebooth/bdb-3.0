-- =============================================
-- Stored Procedure: sp_Vendor_GetSocialMedia
-- Description: Gets social media for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetSocialMedia]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetSocialMedia];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetSocialMedia]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Platform, URL, DisplayOrder
    FROM VendorSocialMedia
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END
GO
