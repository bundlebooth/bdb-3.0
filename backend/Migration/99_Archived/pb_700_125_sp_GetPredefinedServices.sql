-- =============================================
-- Stored Procedure: core.sp_GetPredefinedServices
-- Description: Gets all predefined services
-- Phase: 600 (Stored Procedures)
-- Schema: core
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[core].[sp_GetPredefinedServices]'))
    DROP PROCEDURE [core].[sp_GetPredefinedServices];
GO

CREATE PROCEDURE [core].[sp_GetPredefinedServices]
AS
BEGIN
    SET NOCOUNT ON;
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

