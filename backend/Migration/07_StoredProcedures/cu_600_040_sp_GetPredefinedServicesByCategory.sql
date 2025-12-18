/*
    Migration Script: Create Stored Procedure [sp_GetPredefinedServicesByCategory]
    Phase: 600 - Stored Procedures
    Script: cu_600_040_dbo.sp_GetPredefinedServicesByCategory.sql
    Description: Creates the [vendors].[sp_GetPredefinedServicesByCategory] stored procedure
    
    Execution Order: 40
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetPredefinedServicesByCategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPredefinedServicesByCategory]'))
    DROP PROCEDURE [vendors].[sp_GetPredefinedServicesByCategory];
GO

CREATE   PROCEDURE [vendors].[sp_GetPredefinedServicesByCategory]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        Category,
        ServiceName,
        ServiceDescription,
        DefaultDurationMinutes,
        DisplayOrder
    FROM admin.PredefinedServices
    WHERE IsActive = 1
        AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder, ServiceName;
END

GO

PRINT 'Stored procedure [vendors].[sp_GetPredefinedServicesByCategory] created successfully.';
GO

