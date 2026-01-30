/*
    Migration Script: Create Stored Procedure [sp_Vendor_GetSubcategories]
    Phase: 700 - Stored Procedures
    Script: pb_700_551_sp_Vendor_GetSubcategories.sql
    Description: Gets a vendor's selected subcategories
    
    Execution Order: 551
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_GetSubcategories]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_GetSubcategories]'))
    DROP PROCEDURE [vendors].[sp_Vendor_GetSubcategories];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_GetSubcategories]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vs.VendorSubcategoryID,
        vs.VendorProfileID,
        vs.SubcategoryID,
        s.Category,
        s.SubcategoryKey,
        s.SubcategoryName,
        s.Description,
        s.DisplayOrder,
        vs.CreatedAt
    FROM [vendors].[Subcategories] vs
    INNER JOIN [admin].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID
      AND s.IsActive = 1
    ORDER BY s.DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_GetSubcategories] created successfully.';
GO
