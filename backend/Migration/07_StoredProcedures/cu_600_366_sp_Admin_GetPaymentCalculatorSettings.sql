-- =============================================
-- Stored Procedure: sp_Admin_GetPaymentCalculatorSettings
-- Description: Gets active commission settings for payment calculator
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPaymentCalculatorSettings]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPaymentCalculatorSettings];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPaymentCalculatorSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings')
    BEGIN
        SELECT SettingKey, SettingValue FROM CommissionSettings WHERE IsActive = 1;
    END
    ELSE
    BEGIN
        SELECT NULL as SettingKey, NULL as SettingValue WHERE 1=0;
    END
END
GO
