-- =============================================
-- Stored Procedure: sp_GetServiceName
-- Description: Gets service name by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetServiceName]'))
    DROP PROCEDURE [dbo].[sp_GetServiceName];
GO

CREATE PROCEDURE [dbo].[sp_GetServiceName]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 Name FROM Services WHERE ServiceID = @ServiceID;
END
GO
