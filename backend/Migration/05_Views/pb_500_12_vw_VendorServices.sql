/*
    Migration Script: Create View [vw_VendorServices]
    Phase: 400 - Views
    Script: cu_400_14_dbo.vw_VendorServices.sql
    Description: Creates the [vendors].[vw_VendorServices] view
    
    Execution Order: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorServices]'))
    DROP VIEW [vendors].[vw_VendorServices];
GO

CREATE VIEW [vendors].[vw_VendorServices] AS
SELECT 
    s.ServiceID,
    s.CategoryID,
    sc.VendorProfileID,  -- Changed to get from ServiceCategories
    sc.Name AS CategoryName,
    v.BusinessName AS VendorName,
    s.Name AS ServiceName,
    s.Description,
    s.Price,
    s.DurationMinutes,
    s.MinDuration,
    s.MaxAttendees,
    s.RequiresDeposit,
    s.DepositPercentage,
    s.CancellationPolicy,
    (SELECT TOP 1 si.ImageURL FROM vendors.ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS PrimaryImage,
    (SELECT COUNT(*) FROM bookings.Bookings b WHERE b.ServiceID = s.ServiceID) AS BookingCount
FROM vendors.Services s
JOIN vendors.ServiceCategories sc ON s.CategoryID = sc.CategoryID
JOIN vendors.VendorProfiles v ON sc.VendorProfileID = v.VendorProfileID
WHERE s.IsActive = 1;
GO

PRINT 'View [vendors].[vw_VendorServices] created successfully.';
GO
