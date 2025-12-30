-- =============================================
-- Stored Procedure: admin.sp_UpdateCommissionSetting
-- Description: Updates a commission setting
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdateCommissionSetting]'))
    DROP PROCEDURE [admin].[sp_UpdateCommissionSetting];
GO

CREATE PROCEDURE [admin].[sp_UpdateCommissionSetting]
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(255),
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE admin.CommissionSettings 
    SET SettingValue = @SettingValue, Description = ISNULL(@Description, Description), UpdatedAt = GETUTCDATE()
    WHERE SettingKey = @SettingKey;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
