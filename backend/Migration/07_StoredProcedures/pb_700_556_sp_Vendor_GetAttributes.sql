/*
    Migration Script: Create Stored Procedure [sp_Vendor_GetAttributes]
    Phase: 700 - Stored Procedures
    Script: pb_700_556_sp_Vendor_GetAttributes.sql
    Description: Gets all vendor attributes including event types, cultures, and profile settings
    
    Execution Order: 556
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
    
    -- Get profile attributes
    SELECT 
        vp.VendorProfileID,
        vp.InstantBookingEnabled,
        vp.MinBookingLeadTimeHours,
        vp.ServiceLocationScope,
        vp.YearsOfExperienceRange,
        vp.PriceType,
        vp.BasePrice,
        vp.YearsInBusiness
    FROM [vendors].[VendorProfiles] vp
    WHERE vp.VendorProfileID = @VendorProfileID;
    
    -- Get event types
    SELECT 
        vet.VendorEventTypeID,
        vet.EventTypeID,
        et.EventTypeKey,
        et.EventTypeName
    FROM [vendors].[VendorEventTypes] vet
    INNER JOIN [admin].[EventTypes] et ON vet.EventTypeID = et.EventTypeID
    WHERE vet.VendorProfileID = @VendorProfileID
      AND et.IsActive = 1
    ORDER BY et.DisplayOrder;
    
    -- Get cultures
    SELECT 
        vc.VendorCultureID,
        vc.CultureID,
        c.CultureKey,
        c.CultureName
    FROM [vendors].[VendorCultures] vc
    INNER JOIN [admin].[Cultures] c ON vc.CultureID = c.CultureID
    WHERE vc.VendorProfileID = @VendorProfileID
      AND c.IsActive = 1
    ORDER BY c.DisplayOrder;
    
    -- Get subcategories
    SELECT 
        vs.VendorSubcategoryID,
        vs.SubcategoryID,
        s.Category,
        s.SubcategoryKey,
        s.SubcategoryName
    FROM [vendors].[VendorSubcategories] vs
    INNER JOIN [admin].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID
      AND s.IsActive = 1
    ORDER BY s.DisplayOrder;
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_GetAttributes] created successfully.';
GO
