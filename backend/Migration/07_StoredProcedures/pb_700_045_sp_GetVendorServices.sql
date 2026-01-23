/*
    Migration Script: Create Stored Procedure [sp_GetVendorServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_077_dbo.sp_GetVendorServices.sql
    Description: Creates the [vendors].[sp_GetServices] stored procedure
    
    Execution Order: 77
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetServices]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServices]'))
    DROP PROCEDURE [vendors].[sp_GetServices];
GO

CREATE   PROCEDURE [vendors].[sp_GetServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        sc.CategoryID,
        sc.Name AS CategoryName,
        sc.Description AS CategoryDescription,
        s.ServiceID,
        s.Name AS ServiceName,
        s.Description AS ServiceDescription,
        s.Price,
        s.DurationMinutes,
        s.MinDuration,
        s.MaxAttendees,
        s.IsActive,
        s.RequiresDeposit,
        s.DepositPercentage,
        s.CancellationPolicy,
        (SELECT TOP 1 si.ImageURL FROM ServiceImages si WHERE si.ServiceID = s.ServiceID AND si.IsPrimary = 1) AS PrimaryImage
    FROM vendors.ServiceCategories sc
    JOIN vendors.Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetServices] created successfully.';
GO
