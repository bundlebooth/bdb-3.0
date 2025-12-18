-- =============================================
-- Stored Procedure: sp_Admin_GetCommissionSettings
-- Description: Gets commission settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetCommissionSettings]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetCommissionSettings];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings')
    BEGIN
        SELECT SettingID, SettingKey, SettingValue, Description, SettingType, MinValue, MaxValue, IsActive, CreatedAt, UpdatedAt
        FROM CommissionSettings
        ORDER BY SettingKey;
    END
    ELSE
    BEGIN
        SELECT NULL as SettingID WHERE 1=0;
    END
END
GO
