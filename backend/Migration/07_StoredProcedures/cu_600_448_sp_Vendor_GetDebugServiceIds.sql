-- =============================================
-- Stored Procedure: sp_Vendor_GetDebugServiceIds
-- Description: Gets all predefined service IDs for debugging
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetDebugServiceIds]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetDebugServiceIds];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetDebugServiceIds]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PredefinedServiceID,
        ServiceName,
        Category,
        ServiceDescription
    FROM PredefinedServices 
    ORDER BY Category, DisplayOrder, ServiceName;
END
GO
