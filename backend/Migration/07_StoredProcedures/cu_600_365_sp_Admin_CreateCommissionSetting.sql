-- =============================================
-- Stored Procedure: sp_Admin_CreateCommissionSetting
-- Description: Creates a new commission setting
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_CreateCommissionSetting]'))
    DROP PROCEDURE [dbo].[sp_Admin_CreateCommissionSetting];
GO

CREATE PROCEDURE [dbo].[sp_Admin_CreateCommissionSetting]
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
