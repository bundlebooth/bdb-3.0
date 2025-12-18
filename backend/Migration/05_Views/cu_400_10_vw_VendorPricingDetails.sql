/*
    Migration Script: Create View [vw_VendorPricingDetails]
    Phase: 400 - Views
    Script: cu_400_10_dbo.vw_VendorPricingDetails.sql
    Description: Creates the [vendors].[vw_VendorPricingDetails] view
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorPricingDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorPricingDetails]'))
    DROP VIEW [vendors].[vw_VendorPricingDetails];
GO

CREATE VIEW [vendors].[vw_VendorPricingDetails] AS
SELECT 
    s.ServiceID,
    s.VendorProfileID,
    vp.BusinessName AS VendorName,
    s.LinkedPredefinedServiceID AS PredefinedServiceID,
    ps.ServiceName,
    ps.Category,
    s.PricingModel,
    s.Description AS ServiceDescription,
    s.IsActive,
    
    -- Legacy pricing field
    s.Price,
    s.DurationMinutes,
    
    -- Time-based pricing fields
    s.BaseDurationMinutes,
    s.BaseRate,
    s.OvertimeRatePerHour,
    s.MinimumBookingFee,
    
    -- Fixed-based pricing fields
    s.FixedPricingType,
    s.FixedPrice,
    s.PricePerPerson,
    s.MinimumAttendees,
    s.MaximumAttendees,
    
    s.CreatedAt,
    s.UpdatedAt
FROM vendors.Services s
JOIN vendors.VendorProfiles vp ON s.VendorProfileID = vp.VendorProfileID
LEFT JOIN admin.PredefinedServices ps ON s.LinkedPredefinedServiceID = ps.PredefinedServiceID
WHERE s.IsActive = 1;
GO

PRINT 'View [vendors].[vw_VendorPricingDetails] created successfully.';
GO
