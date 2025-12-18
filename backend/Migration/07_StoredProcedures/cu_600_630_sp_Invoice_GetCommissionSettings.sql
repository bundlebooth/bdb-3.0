-- =============================================
-- Stored Procedure: invoices.sp_GetCommissionSettings
-- Description: Gets active commission settings
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetCommissionSettings]'))
    DROP PROCEDURE [invoices].[sp_GetCommissionSettings];
GO

CREATE PROCEDURE [invoices].[sp_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SettingKey, SettingValue 
    FROM CommissionSettings 
    WHERE IsActive = 1;
END
GO
