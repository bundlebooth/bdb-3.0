-- =============================================
-- Stored Procedure: sp_Payment_GetServiceName
-- Description: Gets service name by ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_GetServiceName]'))
    DROP PROCEDURE [dbo].[sp_Payment_GetServiceName];
GO

CREATE PROCEDURE [dbo].[sp_Payment_GetServiceName]
    @ServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT Name FROM Services WHERE ServiceID = @ServiceID;
END
GO
