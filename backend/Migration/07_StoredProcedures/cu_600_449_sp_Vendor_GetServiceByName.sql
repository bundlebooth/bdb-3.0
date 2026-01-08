-- =============================================
-- Stored Procedure: vendors.sp_GetServiceByName
-- Description: Gets a predefined service by name
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServiceByName]'))
    DROP PROCEDURE [vendors].[sp_GetServiceByName];
GO

CREATE PROCEDURE [vendors].[sp_GetServiceByName]
    @ServiceName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
    FROM admin.PredefinedServices 
    WHERE ServiceName = @ServiceName;
END
GO

