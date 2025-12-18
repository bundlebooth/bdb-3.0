-- =============================================
-- Stored Procedure: payments.sp_GetCommissionSettings
-- Description: Gets commission settings from database
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetCommissionSettings]'))
    DROP PROCEDURE [payments].[sp_GetCommissionSettings];
GO

CREATE PROCEDURE [payments].[sp_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    IF OBJECT_ID('dbo.CommissionSettings', 'U') IS NOT NULL
    BEGIN
        SELECT SettingKey, SettingValue FROM CommissionSettings WHERE IsActive = 1;
    END
END
GO
