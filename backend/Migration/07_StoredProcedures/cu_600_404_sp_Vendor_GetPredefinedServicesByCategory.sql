-- =============================================
-- Stored Procedure: sp_Vendor_GetPredefinedServicesByCategory
-- Description: Gets predefined services for a specific category
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetPredefinedServicesByCategory]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetPredefinedServicesByCategory];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetPredefinedServicesByCategory]
    @Category NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
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
GO
