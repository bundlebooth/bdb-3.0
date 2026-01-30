/*
    Migration Script: Create Stored Procedure [sp_Vendor_GetAttributes]
    Phase: 700 - Stored Procedures
    Script: pb_700_539_sp_Vendor_GetAttributes.sql
    Description: Gets all vendor attributes including categories, event types, cultures
    
    Execution Order: 539
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_GetAttributes]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_GetAttributes]'))
    DROP PROCEDURE [vendors].[sp_Vendor_GetAttributes];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_GetAttributes]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile with new attributes
    SELECT 
        vp.VendorProfileID,
        vp.InstantBookingEnabled,
        vp.MinBookingLeadTimeHours,
        vp.ServiceLocationScope,
        vp.YearsOfExperienceRange,
        vp.PriceLevel
    FROM [vendors].[VendorProfiles] vp
    WHERE vp.VendorProfileID = @VendorProfileID;
    
    -- Get vendor categories (using existing VendorCategories table)
    SELECT 
        vc.VendorCategoryID,
        vc.Category,
        vc.IsPrimary
    FROM [vendors].[VendorCategories] vc
    WHERE vc.VendorProfileID = @VendorProfileID
    ORDER BY vc.IsPrimary DESC;
    
    -- Get vendor event types
    SELECT 
        vet.EventTypeID,
        et.EventTypeKey,
        et.EventTypeName
    FROM [vendors].[VendorEventTypes] vet
    INNER JOIN [admin].[EventTypes] et ON vet.EventTypeID = et.EventTypeID
    WHERE vet.VendorProfileID = @VendorProfileID
    ORDER BY et.DisplayOrder;
    
    -- Get vendor cultures
    SELECT 
        vc.CultureID,
        cu.CultureKey,
        cu.CultureName
    FROM [vendors].[VendorCultures] vc
    INNER JOIN [admin].[Cultures] cu ON vc.CultureID = cu.CultureID
    WHERE vc.VendorProfileID = @VendorProfileID
    ORDER BY cu.DisplayOrder;
    
    -- Get vendor subcategories
    SELECT 
        vs.SubcategoryID,
        s.Category,
        s.SubcategoryKey,
        s.SubcategoryName
    FROM [vendors].[Subcategories] vs
    INNER JOIN [admin].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID
    ORDER BY s.Category, s.DisplayOrder;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_GetAttributes] created successfully.';
GO
