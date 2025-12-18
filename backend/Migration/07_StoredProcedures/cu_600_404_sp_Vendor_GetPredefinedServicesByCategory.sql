-- =============================================
-- Stored Procedure: vendors.sp_GetPredefinedServicesByCategory
-- Description: Gets predefined services for a specific category
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPredefinedServicesByCategory]'))
    DROP PROCEDURE [vendors].[sp_GetPredefinedServicesByCategory];
GO

CREATE PROCEDURE [vendors].[sp_GetPredefinedServicesByCategory]
    @Category NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
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
GO

