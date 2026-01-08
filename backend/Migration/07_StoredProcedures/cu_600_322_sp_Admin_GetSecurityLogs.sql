-- =============================================
-- Stored Procedure: admin.sp_GetSecurityLogs
-- Description: Gets security logs with filters
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetSecurityLogs]'))
    DROP PROCEDURE [admin].[sp_GetSecurityLogs];
GO

CREATE PROCEDURE [admin].[sp_GetSecurityLogs]
    @Type NVARCHAR(50) = 'login',
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Check if SecurityLogs table exists
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'SecurityLogs')
    BEGIN
        SELECT 
            LogID as id,
            UserID,
            Email as [user],
            Action as action,
            ActionStatus as status,
            IPAddress as ip,
            Location as location,
            Device as device,
            Details as details,
            CreatedAt as timestamp
        FROM SecurityLogs
        WHERE 
            (@Type = 'login' AND Action IN ('Login', 'Logout', 'LoginFailed') OR
             @Type = 'admin' AND Action LIKE 'Admin%' OR
             @Type = 'flagged' AND ActionStatus = 'Failed' OR
             @Type = 'all')
            AND (@Status IS NULL OR 
                 (@Status = 'success' AND ActionStatus = 'Success') OR
                 (@Status = 'failed' AND ActionStatus = 'Failed'))
            AND (@Search IS NULL OR Email LIKE '%' + @Search + '%' OR Details LIKE '%' + @Search + '%')
        ORDER BY CreatedAt DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        
        SELECT COUNT(*) as total
        FROM SecurityLogs
        WHERE 
            (@Type = 'login' AND Action IN ('Login', 'Logout', 'LoginFailed') OR
             @Type = 'admin' AND Action LIKE 'Admin%' OR
             @Type = 'flagged' AND ActionStatus = 'Failed' OR
             @Type = 'all')
            AND (@Status IS NULL OR 
                 (@Status = 'success' AND ActionStatus = 'Success') OR
                 (@Status = 'failed' AND ActionStatus = 'Failed'))
            AND (@Search IS NULL OR Email LIKE '%' + @Search + '%' OR Details LIKE '%' + @Search + '%');
    END
    ELSE
    BEGIN
        -- Fallback to Users table LastLogin data
        SELECT 
            u.UserID as id,
            u.Email as [user],
            'Login Success' as action,
            'Success' as status,
            NULL as ip,
            NULL as location,
            'Web Browser' as device,
            NULL as details,
            u.LastLogin as timestamp
        FROM users.Users u
        WHERE u.LastLogin IS NOT NULL
        ORDER BY u.LastLogin DESC
        OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
        
        SELECT COUNT(*) as total FROM users.Users WHERE LastLogin IS NOT NULL;
    END
END
GO

