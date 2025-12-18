/*
    Migration Script: Create Stored Procedure [sp_LogSecurityEvent]
    Phase: 600 - Stored Procedures
    Script: cu_600_082_dbo.sp_LogSecurityEvent.sql
    Description: Creates the [admin].[sp_LogSecurityEvent] stored procedure
    
    Execution Order: 82
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_LogSecurityEvent]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_LogSecurityEvent]'))
    DROP PROCEDURE [admin].[sp_LogSecurityEvent];
GO

CREATE   PROCEDURE [admin].[sp_LogSecurityEvent]
    @UserID INT = NULL,
    @Email NVARCHAR(255) = NULL,
    @Action NVARCHAR(50),
    @ActionStatus NVARCHAR(20) = 'Success',
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @Location NVARCHAR(100) = NULL,
    @Device NVARCHAR(100) = NULL,
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, IPAddress, UserAgent, Location, Device, Details)
    VALUES (@UserID, @Email, @Action, @ActionStatus, @IPAddress, @UserAgent, @Location, @Device, @Details);
    
    SELECT SCOPE_IDENTITY() AS LogID;
END;
GO

PRINT 'Stored procedure [admin].[sp_LogSecurityEvent] created successfully.';
GO
