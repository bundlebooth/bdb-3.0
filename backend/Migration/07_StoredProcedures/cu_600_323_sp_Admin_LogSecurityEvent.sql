-- =============================================
-- Stored Procedure: sp_Admin_LogSecurityEvent
-- Description: Logs a security event
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_LogSecurityEvent]'))
    DROP PROCEDURE [dbo].[sp_Admin_LogSecurityEvent];
GO

CREATE PROCEDURE [dbo].[sp_Admin_LogSecurityEvent]
    @UserID INT = NULL,
    @Email NVARCHAR(255),
    @Action NVARCHAR(100),
    @ActionStatus NVARCHAR(50) = 'Success',
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @Location NVARCHAR(255) = NULL,
    @Device NVARCHAR(100) = NULL,
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, IPAddress, UserAgent, Location, Device, Details)
    VALUES (@UserID, @Email, @Action, @ActionStatus, @IPAddress, @UserAgent, @Location, @Device, @Details);
    
    SELECT SCOPE_IDENTITY() AS LogID;
END
GO
