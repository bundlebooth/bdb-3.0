-- =============================================
-- Stored Procedure: sp_Admin_GetPlatformHealth
-- Description: Gets platform health metrics for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPlatformHealth]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPlatformHealth];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPlatformHealth]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Database stats
    SELECT 
        (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as activeConnections,
        (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'User Connections') as userConnections;
    
    -- Storage stats
    SELECT 
        SUM(reserved_page_count) * 8.0 / 1024 as totalSizeMB
    FROM sys.dm_db_partition_stats;
    
    -- Load stats
    SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as vendors,
        (SELECT COUNT(*) FROM Users) as users,
        (SELECT COUNT(*) FROM Bookings) as bookings,
        (SELECT COUNT(*) FROM Reviews) as reviews;
END
GO
