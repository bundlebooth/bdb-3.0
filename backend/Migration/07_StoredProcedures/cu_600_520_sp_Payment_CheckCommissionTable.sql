-- =============================================
-- Stored Procedure: sp_Payment_CheckCommissionTable
-- Description: Checks if CommissionSettings table exists
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_CheckCommissionTable]'))
    DROP PROCEDURE [dbo].[sp_Payment_CheckCommissionTable];
GO

CREATE PROCEDURE [dbo].[sp_Payment_CheckCommissionTable]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'CommissionSettings';
END
GO
