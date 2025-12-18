-- =============================================
-- Stored Procedure: sp_Invoice_GetCommissionSettings
-- Description: Gets active commission settings
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Invoice_GetCommissionSettings]'))
    DROP PROCEDURE [dbo].[sp_Invoice_GetCommissionSettings];
GO

CREATE PROCEDURE [dbo].[sp_Invoice_GetCommissionSettings]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT SettingKey, SettingValue 
    FROM CommissionSettings 
    WHERE IsActive = 1;
END
GO
