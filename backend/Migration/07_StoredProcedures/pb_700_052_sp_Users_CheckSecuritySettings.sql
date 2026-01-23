-- =============================================
-- Stored Procedure: users.sp_CheckSecuritySettings
-- Description: Gets security settings for 2FA enforcement during login
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_CheckSecuritySettings]'))
    DROP PROCEDURE [users].[sp_CheckSecuritySettings];
GO

CREATE PROCEDURE [users].[sp_CheckSecuritySettings]
AS
BEGIN
    SET NOCOUNT ON;

    -- Return settings from admin.SecuritySettings key-value table
    SELECT SettingKey, SettingValue 
    FROM admin.SecuritySettings 
    WHERE IsActive = 1;
END
GO
