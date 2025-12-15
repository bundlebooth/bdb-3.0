/*
    Migration Script: Create Stored Procedure [sp_GetPredefinedServicesByCategory]
    Phase: 600 - Stored Procedures
    Script: cu_600_040_dbo.sp_GetPredefinedServicesByCategory.sql
    Description: Creates the [dbo].[sp_GetPredefinedServicesByCategory] stored procedure
    
    Execution Order: 40
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetPredefinedServicesByCategory]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetPredefinedServicesByCategory]'))
    DROP PROCEDURE [dbo].[sp_GetPredefinedServicesByCategory];
GO

CREATE   PROCEDURE [dbo].[sp_GetPredefinedServicesByCategory]
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
    FROM PredefinedServices
    WHERE IsActive = 1
        AND (@Category IS NULL OR Category = @Category)
    ORDER BY Category, DisplayOrder, ServiceName;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetPredefinedServicesByCategory] created successfully.';
GO
