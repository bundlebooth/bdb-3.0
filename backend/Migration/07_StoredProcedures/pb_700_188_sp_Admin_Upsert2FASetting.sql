-- =============================================
-- Stored Procedure: admin.sp_Upsert2FASetting
-- Description: Creates or updates a 2FA security setting
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_Upsert2FASetting]'))
    DROP PROCEDURE [admin].[sp_Upsert2FASetting];
GO

CREATE PROCEDURE [admin].[sp_Upsert2FASetting]
    @SettingKey NVARCHAR(100),
    @SettingValue NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Update admin.SecuritySettings key-value table
    UPDATE admin.SecuritySettings 
    SET SettingValue = @SettingValue, 
        UpdatedAt = GETUTCDATE()
    WHERE SettingKey = @SettingKey;
END
GO
