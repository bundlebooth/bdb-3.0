/*
    Migration Script: Create View [vw_VendorPredefinedServices]
    Phase: 400 - Views
    Script: cu_400_09_dbo.vw_VendorPredefinedServices.sql
    Description: Creates the [vendors].[vw_VendorPredefinedServices] view
    
    Execution Order: 9
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorPredefinedServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorPredefinedServices]'))
    DROP VIEW [vendors].[vw_VendorPredefinedServices];
GO

-- Create view for easy querying of vendor services with predefined service details (legacy)
CREATE VIEW [vendors].[vw_VendorPredefinedServices] AS
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
FROM vendors.VendorSelectedServices vss
JOIN admin.PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
JOIN vendors.VendorProfiles vp ON vss.VendorProfileID = vp.VendorProfileID
WHERE vss.IsActive = 1 AND ps.IsActive = 1;
GO

PRINT 'View [vendors].[vw_VendorPredefinedServices] created successfully.';
GO
