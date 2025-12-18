-- =============================================
-- Stored Procedure: sp_Admin_GetPlatformHealth
-- Description: Gets platform health metrics including DB stats, storage, and load
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPlatformHealth]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPlatformHealth];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPlatformHealth]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get database stats
    SELECT 
        (SELECT COUNT(*) FROM sys.dm_exec_sessions WHERE is_user_process = 1) as activeConnections,
        (SELECT cntr_value FROM sys.dm_os_performance_counters WHERE counter_name = 'User Connections') as userConnections;
    
    -- Get table sizes for storage estimate
    SELECT 
        SUM(reserved_page_count) * 8.0 / 1024 as totalSizeMB
    FROM sys.dm_db_partition_stats;
    
    -- Get record counts for load estimate
    SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as vendors,
        (SELECT COUNT(*) FROM Users) as users,
        (SELECT COUNT(*) FROM Bookings) as bookings,
        (SELECT COUNT(*) FROM Reviews) as reviews;
END
GO
