
-- Get security logs with filters
CREATE   PROCEDURE sp_GetSecurityLogs
    @LogType NVARCHAR(50) = 'all', -- 'all', 'login', 'admin', 'flagged'
    @Status NVARCHAR(20) = NULL,
    @Search NVARCHAR(100) = NULL,
    @Page INT = 1,
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@Page - 1) * @Limit;
    
    SELECT 
        LogID,
        UserID,
        Email,
        Action,
        ActionStatus,
        IPAddress,
        UserAgent,
        Location,
        Device,
        Details,
        CreatedAt
    FROM SecurityLogs
    WHERE 
        (@LogType = 'all' OR 
         (@LogType = 'login' AND Action IN ('Login', 'Logout', 'LoginFailed')) OR
         (@LogType = 'admin' AND Action LIKE 'Admin%') OR
         (@LogType = 'flagged' AND ActionStatus = 'Failed'))
        AND (@Status IS NULL OR ActionStatus = @Status)
        AND (@Search IS NULL OR Email LIKE '%' + @Search + '%' OR Details LIKE '%' + @Search + '%')
    ORDER BY CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY;
    
    SELECT COUNT(*) AS Total
    FROM SecurityLogs
    WHERE 
        (@LogType = 'all' OR 
         (@LogType = 'login' AND Action IN ('Login', 'Logout', 'LoginFailed')) OR
         (@LogType = 'admin' AND Action LIKE 'Admin%') OR
         (@LogType = 'flagged' AND ActionStatus = 'Failed'))
        AND (@Status IS NULL OR ActionStatus = @Status)
        AND (@Search IS NULL OR Email LIKE '%' + @Search + '%' OR Details LIKE '%' + @Search + '%');
END;

GO

