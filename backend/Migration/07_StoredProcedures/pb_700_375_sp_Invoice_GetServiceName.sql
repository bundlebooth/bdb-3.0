-- =============================================
-- Stored Procedure: invoices.sp_GetServiceName
-- Description: Gets service name by ID
-- Phase: 600 (Stored Procedures)
-- Schema: invoices
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[invoices].[sp_GetServiceName]'))
    DROP PROCEDURE [invoices].[sp_GetServiceName];
GO

CREATE PROCEDURE [invoices].[sp_GetServiceName]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 Name FROM vendors.Services WHERE ServiceID = @ServiceID;
END
GO
