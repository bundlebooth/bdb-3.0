-- =============================================
-- Stored Procedure: sp_Payment_GetCommissionSettings
-- Description: Gets active commission settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetCommissionSettings]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetCommissionSettings];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SettingKey, SettingValue FROM CommissionSettings WHERE IsActive = 1;
END
GO
