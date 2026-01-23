/*
    Migration Script: Create Stored Procedure [admin].[sp_GetPublicCommissionInfo]
    Description: Creates the [admin].[sp_GetPublicCommissionInfo] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicCommissionInfo]'))
    DROP PROCEDURE [admin].[sp_GetPublicCommissionInfo];
GO


CREATE PROCEDURE [admin].[sp_GetPublicCommissionInfo]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'CommissionSettings' AND SCHEMA_NAME(schema_id) = 'admin')
    BEGIN
        SELECT SettingKey, SettingValue, Description
        FROM admin.CommissionSettings
        WHERE IsActive = 1;
    END
END
GO
