-- =============================================
-- Stored Procedure: sp_Vendors_GetPredefinedServices
-- Description: Gets all predefined services grouped by category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendors_GetPredefinedServices]'))
    DROP PROCEDURE [dbo].[sp_Vendors_GetPredefinedServices];
GO

CREATE PROCEDURE [dbo].[sp_Vendors_GetPredefinedServices]
    @Category NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @Category IS NULL
    BEGIN
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
    ELSE
    BEGIN
        SELECT 
            PredefinedServiceID,
            ServiceName,
            ServiceDescription,
            DefaultDurationMinutes,
            DisplayOrder
        FROM PredefinedServices 
        WHERE Category = @Category
        ORDER BY DisplayOrder, ServiceName;
    END
END
GO
