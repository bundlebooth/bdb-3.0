-- =============================================
-- Stored Procedure: admin.sp_GetPlatformHealth
-- Description: Gets platform health metrics for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPlatformHealth]'))
    DROP PROCEDURE [admin].[sp_GetPlatformHealth];
GO

CREATE PROCEDURE [admin].[sp_GetPlatformHealth]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Database stats - count only active requests (queries currently running), not idle sessions
    SELECT 
        (SELECT COUNT(*) FROM sys.dm_exec_requests WHERE session_id > 50) as activeConnections,
        (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1 AND status = 'running') as userConnections;
    
    -- Storage stats
    SELECT 
        SUM(reserved_page_count) * 8.0 / 1024 as totalSizeMB
    FROM sys.dm_db_partition_stats;
    
    -- Load stats
    SELECT
        (SELECT COUNT(*) FROM vendors.VendorProfiles) as vendors,
        (SELECT COUNT(*) FROM users.Users) as users,
        (SELECT COUNT(*) FROM bookings.Bookings) as bookings,
        (SELECT COUNT(*) FROM vendors.Reviews) as reviews;
END
GO




