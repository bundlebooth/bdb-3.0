
-- Create view for easy querying of vendor services with predefined service details (legacy)
CREATE   VIEW vw_VendorPredefinedServices AS
SELECT 
    vss.VendorSelectedServiceID,
    vss.VendorProfileID,
    vp.BusinessName AS VendorName,
    ps.PredefinedServiceID,
    ps.Category,
    ps.ServiceName,
    ps.ServiceDescription,
    vss.VendorPrice AS Price,
    COALESCE(vss.VendorDurationMinutes, ps.DefaultDurationMinutes) AS DurationMinutes,
    COALESCE(vss.VendorDescription, ps.ServiceDescription) AS Description,
    vss.IsActive AS VendorServiceActive,
    ps.IsActive AS PredefinedServiceActive,
    vss.CreatedAt AS SelectedAt
FROM VendorSelectedServices vss
JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
JOIN VendorProfiles vp ON vss.VendorProfileID = vp.VendorProfileID
WHERE vss.IsActive = 1 AND ps.IsActive = 1;

GO

