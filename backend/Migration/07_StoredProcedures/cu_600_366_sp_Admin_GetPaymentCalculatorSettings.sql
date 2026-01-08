-- =============================================
-- Stored Procedure: admin.sp_GetPaymentCalculatorSettings
-- Description: Gets active commission settings for payment calculator
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPaymentCalculatorSettings]'))
    DROP PROCEDURE [admin].[sp_GetPaymentCalculatorSettings];
GO

CREATE PROCEDURE [admin].[sp_GetPaymentCalculatorSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings' AND SCHEMA_NAME(schema_id) = 'admin')
    BEGIN
        SELECT SettingKey, SettingValue FROM admin.CommissionSettings WHERE IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT NULL as SettingKey, NULL as SettingValue WHERE 1=0;
    END
END
GO
