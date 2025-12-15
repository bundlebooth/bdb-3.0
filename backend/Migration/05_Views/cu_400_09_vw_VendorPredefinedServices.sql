/*
    Migration Script: Create View [vw_VendorPredefinedServices]
    Phase: 400 - Views
    Script: cu_400_09_dbo.vw_VendorPredefinedServices.sql
    Description: Creates the [dbo].[vw_VendorPredefinedServices] view
    
    Execution Order: 9
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [dbo].[vw_VendorPredefinedServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[dbo].[vw_VendorPredefinedServices]'))
    DROP VIEW [dbo].[vw_VendorPredefinedServices];
GO

-- Create view for easy querying of vendor services with predefined service details (legacy)
CREATE VIEW [dbo].[vw_VendorPredefinedServices] AS
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

PRINT 'View [dbo].[vw_VendorPredefinedServices] created successfully.';
GO
