-- =============================================
-- Stored Procedure: vendors.sp_GetPredefinedServices
-- Description: Gets all predefined services grouped by category
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetPredefinedServices]'))
    DROP PROCEDURE [vendors].[sp_GetPredefinedServices];
GO

CREATE PROCEDURE [vendors].[sp_GetPredefinedServices]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if table exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PredefinedServices')
    BEGIN
        SELECT 0 AS TableExists;
        RETURN;
    END
    
    SELECT 1 AS TableExists;
    
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
GO

