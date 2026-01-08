-- =============================================
-- Stored Procedure: vendors.sp_ValidatePredefinedServiceIds
-- Description: Validates predefined service IDs exist
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_ValidatePredefinedServiceIds]'))
    DROP PROCEDURE [vendors].[sp_ValidatePredefinedServiceIds];
GO

CREATE PROCEDURE [vendors].[sp_ValidatePredefinedServiceIds]
    @ServiceIds NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PredefinedServiceID, ServiceName, Category 
    FROM admin.PredefinedServices 
    WHERE PredefinedServiceID IN (SELECT value FROM STRING_SPLIT(@ServiceIds, ','));
END
GO

