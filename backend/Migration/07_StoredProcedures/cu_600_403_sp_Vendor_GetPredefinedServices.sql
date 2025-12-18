-- =============================================
-- Stored Procedure: sp_Vendor_GetPredefinedServices
-- Description: Gets all predefined services grouped by category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetPredefinedServices]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetPredefinedServices];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetPredefinedServices]
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
    FROM PredefinedServices 
    ORDER BY Category, DisplayOrder, ServiceName;
END
GO
