-- =============================================
-- Stored Procedure: sp_Vendor_ValidatePredefinedServiceIds
-- Description: Validates predefined service IDs exist
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_ValidatePredefinedServiceIds]'))
    DROP PROCEDURE [dbo].[sp_Vendor_ValidatePredefinedServiceIds];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_ValidatePredefinedServiceIds]
    @ServiceIds NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT PredefinedServiceID, ServiceName, Category 
    FROM PredefinedServices 
    WHERE PredefinedServiceID IN (SELECT value FROM STRING_SPLIT(@ServiceIds, ','));
END
GO
