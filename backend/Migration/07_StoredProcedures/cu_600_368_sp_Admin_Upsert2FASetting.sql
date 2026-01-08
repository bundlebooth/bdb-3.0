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
    
    -- Create table if not exists
    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'SecuritySettings')
    BEGIN
        CREATE TABLE SecuritySettings (
            SettingID INT PRIMARY KEY IDENTITY(1,1),
            SettingKey NVARCHAR(100) NOT NULL UNIQUE,
            SettingValue NVARCHAR(500) NOT NULL,
            Description NVARCHAR(500),
            IsActive BIT DEFAULT 1,
            UpdatedAt DATETIME DEFAULT GETUTCDATE(),
            UpdatedBy INT
        );
    END
    
    -- Upsert setting
    IF EXISTS (SELECT 1 FROM SecuritySettings WHERE SettingKey = @SettingKey)
        UPDATE SecuritySettings SET SettingValue = @SettingValue, UpdatedAt = GETUTCDATE() WHERE SettingKey = @SettingKey;
    ELSE
        INSERT INTO SecuritySettings (SettingKey, SettingValue) VALUES (@SettingKey, @SettingValue);
END
GO
