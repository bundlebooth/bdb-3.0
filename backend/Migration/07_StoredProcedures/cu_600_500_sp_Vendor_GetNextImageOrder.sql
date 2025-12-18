-- =============================================
-- Stored Procedure: sp_Vendor_GetNextImageOrder
-- Description: Gets the next display order for vendor images
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetNextImageOrder]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetNextImageOrder];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetNextImageOrder]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT ISNULL(MAX(DisplayOrder), -1) + 1 as NextOrder
    FROM VendorImages
    WHERE VendorProfileID = @VendorProfileID;
END
GO
