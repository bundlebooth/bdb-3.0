-- =============================================
-- Stored Procedure: vendors.sp_GetDebugServiceIds
-- Description: Gets all predefined service IDs for debugging
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetDebugServiceIds]'))
    DROP PROCEDURE [vendors].[sp_GetDebugServiceIds];
GO

CREATE PROCEDURE [vendors].[sp_GetDebugServiceIds]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
    FROM admin.PredefinedServices 
    ORDER BY Category, DisplayOrder, ServiceName;
END
GO

