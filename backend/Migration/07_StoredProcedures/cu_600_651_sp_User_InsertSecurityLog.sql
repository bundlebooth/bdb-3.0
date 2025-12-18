-- =============================================
-- Stored Procedure: users.sp_InsertSecurityLog
-- Description: Inserts a security log entry
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_InsertSecurityLog]'))
    DROP PROCEDURE [users].[sp_InsertSecurityLog];
GO

CREATE PROCEDURE [users].[sp_InsertSecurityLog]
    @UserID INT,
    @Email NVARCHAR(255),
    @Action NVARCHAR(100),
    @ActionStatus NVARCHAR(50),
    @IPAddress NVARCHAR(50),
    @UserAgent NVARCHAR(500),
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
