-- =============================================
-- Stored Procedure: sp_Payments_GetCommissionSettings
-- Description: Gets commission settings from database
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payments_GetCommissionSettings]'))
    DROP PROCEDURE [dbo].[sp_Payments_GetCommissionSettings];
GO

CREATE PROCEDURE [dbo].[sp_Payments_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF OBJECT_ID('dbo.CommissionSettings', 'U') IS NOT NULL
    BEGIN
        SELECT SettingKey, SettingValue FROM CommissionSettings WHERE IsActive = 1;
    END
END
GO
