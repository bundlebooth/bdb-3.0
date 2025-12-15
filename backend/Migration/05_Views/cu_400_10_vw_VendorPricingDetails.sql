/*
    Migration Script: Create View [vw_VendorPricingDetails]
    Phase: 400 - Views
    Script: cu_400_10_dbo.vw_VendorPricingDetails.sql
    Description: Creates the [dbo].[vw_VendorPricingDetails] view
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_VendorPricingDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_VendorPricingDetails]'))
    DROP VIEW [dbo].[vw_VendorPricingDetails];
GO

CREATE VIEW [dbo].[vw_VendorPricingDetails] AS
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
FROM Services s
JOIN VendorProfiles vp ON s.VendorProfileID = vp.VendorProfileID
LEFT JOIN PredefinedServices ps ON s.LinkedPredefinedServiceID = ps.PredefinedServiceID
WHERE s.IsActive = 1;
GO

PRINT 'View [dbo].[vw_VendorPricingDetails] created successfully.';
GO
