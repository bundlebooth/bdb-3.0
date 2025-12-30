-- =============================================
-- Stored Procedure: payments.sp_CheckCommissionTable
-- Description: Checks if CommissionSettings table exists
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_CheckCommissionTable]'))
    DROP PROCEDURE [payments].[sp_CheckCommissionTable];
GO

CREATE PROCEDURE [payments].[sp_CheckCommissionTable]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT COUNT(*) as cnt FROM sys.tables WHERE name = 'CommissionSettings' AND SCHEMA_NAME(schema_id) = 'admin';
END
GO
