-- =============================================
-- Stored Procedure: users.sp_LogSecurityEvent
-- Description: Logs security events like login attempts
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_LogSecurityEvent]'))
    DROP PROCEDURE [users].[sp_LogSecurityEvent];
GO

CREATE PROCEDURE [users].[sp_LogSecurityEvent]
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
