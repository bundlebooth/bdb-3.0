-- =============================================
-- Stored Procedure: sp_Users_LogSecurityEvent
-- Description: Logs security events like login attempts
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Users_LogSecurityEvent]'))
    DROP PROCEDURE [dbo].[sp_Users_LogSecurityEvent];
GO

CREATE PROCEDURE [dbo].[sp_Users_LogSecurityEvent]
    @UserID INT = NULL,
    @Email NVARCHAR(255) = NULL,
    @Action NVARCHAR(100),
    @ActionStatus NVARCHAR(50),
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @Device NVARCHAR(255) = NULL,
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, IPAddress, UserAgent, Device, Details)
    VALUES (@UserID, @Email, @Action, @ActionStatus, @IPAddress, @UserAgent, @Device, @Details);
    
    SELECT SCOPE_IDENTITY() AS LogID;
END
GO
