-- =============================================
-- Stored Procedure: sp_Admin_UpdateCommissionSetting
-- Description: Updates a commission setting
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdateCommissionSetting]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdateCommissionSetting];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdateCommissionSetting]
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(255),
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE CommissionSettings 
    SET SettingValue = @SettingValue, Description = ISNULL(@Description, Description), UpdatedAt = GETUTCDATE()
    WHERE SettingKey = @SettingKey;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
