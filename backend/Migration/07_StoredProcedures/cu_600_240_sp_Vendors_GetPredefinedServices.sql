-- =============================================
-- Stored Procedure: vendors.sp_GetPredefinedServices
-- Description: Gets all predefined services grouped by category
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPredefinedServices]'))
    DROP PROCEDURE [vendors].[sp_GetPredefinedServices];
GO

CREATE PROCEDURE [vendors].[sp_GetPredefinedServices]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Category IS NULL
    BEGIN
        SELECT 
            Category,
            PredefinedServiceID,
            ServiceName,
            ServiceDescription,
            DefaultDurationMinutes,
            DisplayOrder
        FROM admin.PredefinedServices 
        ORDER BY Category, DisplayOrder, ServiceName;
    END
    ELSE
    BEGIN
        SELECT 
            PredefinedServiceID,
            ServiceName,
            ServiceDescription,
            DefaultDurationMinutes,
            DisplayOrder
        FROM admin.PredefinedServices 
        WHERE Category = @Category
        ORDER BY DisplayOrder, ServiceName;
    END
END
GO

