-- =============================================
-- Stored Procedure: sp_Vendor_GetServiceCategoryId
-- Description: Gets category ID by name for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetServiceCategoryId]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetServiceCategoryId];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetServiceCategoryId]
    @VendorProfileID INT,
    @CategoryName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CategoryID FROM ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = @CategoryName;
END
GO
