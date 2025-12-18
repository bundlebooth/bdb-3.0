-- =============================================
-- Stored Procedure: admin.sp_GetSecurityAudit
-- Description: Gets security audit information including failed logins
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSecurityAudit]'))
    DROP PROCEDURE [admin].[sp_GetSecurityAudit];
GO

CREATE PROCEDURE [admin].[sp_GetSecurityAudit]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get failed login attempts
    SELECT TOP 10
        'Account' as type,
        Email as item,
        'Failed login attempts' as issue,
        COUNT(*) as count,
        MAX(CreatedAt) as lastOccurrence
    FROM SecurityLogs
    WHERE ActionStatus = 'Failed' AND Action = 'Login'
    AND CreatedAt >= DATEADD(day, -7, GETDATE())
    GROUP BY Email
    HAVING COUNT(*) >= 3
    ORDER BY count DESC;
END
GO
