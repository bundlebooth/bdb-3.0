
-- Create unified view for vendor pricing details using Services table
CREATE   VIEW vw_VendorPricingDetails AS
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

