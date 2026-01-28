/*
    Migration Script: Create Stored Procedure [sp_GetVendorProfileWithAttributes]
    Phase: 700 - Stored Procedures
    Script: pb_700_545_sp_GetVendorProfileWithAttributes.sql
    Description: Gets vendor profile with all new attributes for display
    
    Execution Order: 545
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetVendorProfileWithAttributes]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetVendorProfileWithAttributes]'))
    DROP PROCEDURE [vendors].[sp_GetVendorProfileWithAttributes];
GO

CREATE PROCEDURE [vendors].[sp_GetVendorProfileWithAttributes]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get main vendor profile with new booking settings
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription,
        vp.Tagline,
        vp.LogoURL,
        vp.PriceLevel,
        vp.City,
        vp.State,
        vp.Country,
        vp.AvgRating,
        vp.TotalReviews,
        vp.TotalBookings,
        vp.InstantBookingEnabled,
        vp.MinBookingLeadTimeHours,
        vp.ServiceLocationScope,
        vp.YearsOfExperienceRange,
        vp.IsPremium,
        vp.IsEcoFriendly,
        vp.IsAwardWinning,
        vp.IsLastMinute,
        vp.IsCertified,
        vp.IsInsured,
        vp.IsLocal,
        vp.IsMobile,
        vp.YearsInBusiness
    FROM [vendors].[VendorProfiles] vp
    WHERE vp.VendorProfileID = @VendorProfileID;
    
    -- Get vendor categories (using existing VendorCategories table with string-based category keys)
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
    FROM [vendors].[VendorSubcategories] vs
    INNER JOIN [admin].[Subcategories] s ON vs.SubcategoryID = s.SubcategoryID
    WHERE vs.VendorProfileID = @VendorProfileID
      AND s.IsActive = 1
    ORDER BY s.Category, s.DisplayOrder;
    
    -- Get vendor category answers (for category-specific details)
    SELECT 
        vca.AnswerID,
        vca.QuestionID,
        cq.QuestionText,
        cq.QuestionType,
        vca.Answer,
        cq.Category,
        cq.IsFilterable,
        cq.FilterLabel
    FROM [vendors].[VendorCategoryAnswers] vca
    INNER JOIN [admin].[CategoryQuestions] cq ON vca.QuestionID = cq.QuestionID
    WHERE vca.VendorProfileID = @VendorProfileID
      AND cq.IsActive = 1
    ORDER BY cq.Category, cq.DisplayOrder;
END;
GO

PRINT 'Stored procedure [vendors].[sp_GetVendorProfileWithAttributes] created successfully.';
GO
