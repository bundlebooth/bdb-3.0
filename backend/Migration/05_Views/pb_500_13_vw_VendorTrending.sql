/*
    Migration Script: Create View [vw_VendorTrending]
    Phase: 400 - Views
    Script: cu_400_15_dbo.vw_VendorTrending.sql
    Description: Creates the [vendors].[vw_VendorTrending] view
    
    Execution Order: 15
*/

SET NOCOUNT ON;
GO

PRINT 'Creating view [vendors].[vw_VendorTrending]...';
GO

IF EXISTS (SELECT 1 FROM sys.views WHERE object_id = OBJECT_ID(N'[vendors].[vw_VendorTrending]'))
    DROP VIEW [vendors].[vw_VendorTrending];
GO

CREATE VIEW [vendors].[vw_VendorTrending]
WITH SCHEMABINDING
AS
SELECT 
    VendorProfileID,
    COUNT_BIG(*) AS ViewCount7Days
FROM vendors.VendorProfileViews
WHERE ViewedAt >= DATEADD(DAY, -7, GETDATE())
GROUP BY VendorProfileID;
GO

PRINT 'View [vendors].[vw_VendorTrending] created successfully.';
GO
