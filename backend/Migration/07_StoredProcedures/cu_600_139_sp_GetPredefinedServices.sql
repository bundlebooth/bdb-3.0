-- =============================================
-- Stored Procedure: sp_GetPredefinedServices
-- Description: Gets all predefined services
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetPredefinedServices]'))
    DROP PROCEDURE [dbo].[sp_GetPredefinedServices];
GO

CREATE PROCEDURE [dbo].[sp_GetPredefinedServices]
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
    FROM PredefinedServices 
    ORDER BY Category, DisplayOrder, ServiceName;
END
GO
