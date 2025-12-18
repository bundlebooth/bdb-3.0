-- =============================================
-- Stored Procedure: sp_Vendor_GetImages
-- Description: Gets vendor images
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetImages]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetImages];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetImages]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ImageID, ImageURL, Caption, IsPrimary, DisplayOrder, ImageType
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY DisplayOrder;
END
GO
