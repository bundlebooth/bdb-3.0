/*
    Migration Script: Create Stored Procedure [sp_GetVendorServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_077_dbo.sp_GetVendorServices.sql
    Description: Creates the [dbo].[sp_GetVendorServices] stored procedure
    
    Execution Order: 77
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorServices]'))
    DROP PROCEDURE [dbo].[sp_GetVendorServices];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorServices]
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
    FROM ServiceCategories sc
    JOIN Services s ON sc.CategoryID = s.CategoryID
    WHERE sc.VendorProfileID = @VendorProfileID
    ORDER BY sc.DisplayOrder, sc.Name, s.Name;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorServices] created successfully.';
GO
