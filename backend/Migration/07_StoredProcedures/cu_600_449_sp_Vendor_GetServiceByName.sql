-- =============================================
-- Stored Procedure: sp_Vendor_GetServiceByName
-- Description: Gets a predefined service by name
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetServiceByName]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetServiceByName];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetServiceByName]
    @ServiceName NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
    FROM PredefinedServices 
    WHERE ServiceName = @ServiceName;
END
GO
