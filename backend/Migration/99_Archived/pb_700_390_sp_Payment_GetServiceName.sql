-- =============================================
-- Stored Procedure: payments.sp_GetServiceName
-- Description: Gets service name by ID
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_GetServiceName]'))
    DROP PROCEDURE [payments].[sp_GetServiceName];
GO

CREATE PROCEDURE [payments].[sp_GetServiceName]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Name FROM vendors.Services WHERE ServiceID = @ServiceID;
END
GO
