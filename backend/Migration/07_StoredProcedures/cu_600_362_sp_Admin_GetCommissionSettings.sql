-- =============================================
-- Stored Procedure: admin.sp_GetCommissionSettings
-- Description: Gets commission settings
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetCommissionSettings]'))
    DROP PROCEDURE [admin].[sp_GetCommissionSettings];
GO

CREATE PROCEDURE [admin].[sp_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings' AND SCHEMA_NAME(schema_id) = 'admin')
    BEGIN
        SELECT SettingID, SettingKey, SettingValue, Description, SettingType, MinValue, MaxValue, IsActive, CreatedAt, UpdatedAt
        FROM admin.CommissionSettings
        ORDER BY SettingKey;
    END
    ELSE
    BEGIN
        SELECT NULL as SettingID WHERE 1=0;
    END
END
GO
