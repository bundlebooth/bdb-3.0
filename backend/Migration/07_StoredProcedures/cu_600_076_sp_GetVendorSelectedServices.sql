/*
    Migration Script: Create Stored Procedure [sp_GetVendorSelectedServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_076_dbo.sp_GetVendorSelectedServices.sql
    Description: Creates the [dbo].[sp_GetVendorSelectedServices] stored procedure
    
    Execution Order: 76
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorSelectedServices]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorSelectedServices]'))
    DROP PROCEDURE [dbo].[sp_GetVendorSelectedServices];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorSelectedServices]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vss.VendorSelectedServiceID,
        ps.PredefinedServiceID,
        ps.Category,
        ps.ServiceName,
        ps.ServiceDescription,
        ps.DefaultDurationMinutes,
        vss.VendorPrice,
        vss.VendorDurationMinutes,
        vss.VendorDescription,
        vss.ImageURL,
        vss.VendorPrice AS FinalPrice,
        COALESCE(vss.VendorDurationMinutes, ps.DefaultDurationMinutes) AS FinalDurationMinutes,
        COALESCE(vss.VendorDescription, ps.ServiceDescription) AS FinalDescription
    FROM VendorSelectedServices vss
    JOIN PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
    WHERE vss.VendorProfileID = @VendorProfileID
        AND vss.IsActive = 1
        AND ps.IsActive = 1
    ORDER BY ps.Category, ps.DisplayOrder, ps.ServiceName;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorSelectedServices] created successfully.';
GO
