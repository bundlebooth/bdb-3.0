-- =============================================
-- Stored Procedure: admin.sp_CreateCommissionSetting
-- Description: Creates a new commission setting
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CreateCommissionSetting]'))
    DROP PROCEDURE [admin].[sp_CreateCommissionSetting];
GO

CREATE PROCEDURE [admin].[sp_CreateCommissionSetting]
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(255),
    @Description NVARCHAR(500) = NULL,
    @SettingType NVARCHAR(50) = 'percentage',
    @MinValue DECIMAL(10,2) = NULL,
    @MaxValue DECIMAL(10,2) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO CommissionSettings (SettingKey, SettingValue, Description, SettingType, MinValue, MaxValue, IsActive)
    OUTPUT INSERTED.*
    VALUES (@SettingKey, @SettingValue, @Description, @SettingType, @MinValue, @MaxValue, 1);
END
GO
