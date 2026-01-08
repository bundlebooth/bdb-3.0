/*
    Migration Script: Create Stored Procedure [sp_GetVendorSelectedServices]
    Phase: 600 - Stored Procedures
    Script: cu_600_076_dbo.sp_GetVendorSelectedServices.sql
    Description: Creates the [vendors].[sp_GetSelectedServices] stored procedure
    
    Execution Order: 76
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetSelectedServices]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSelectedServices]'))
    DROP PROCEDURE [vendors].[sp_GetSelectedServices];
GO

CREATE   PROCEDURE [vendors].[sp_GetSelectedServices]
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
    FROM vendors.VendorSelectedServices vss
    JOIN admin.PredefinedServices ps ON vss.PredefinedServiceID = ps.PredefinedServiceID
    WHERE vss.VendorProfileID = @VendorProfileID
        AND vss.IsActive = 1
        AND ps.IsActive = 1
    ORDER BY ps.Category, ps.DisplayOrder, ps.ServiceName;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetSelectedServices] created successfully.';
GO


