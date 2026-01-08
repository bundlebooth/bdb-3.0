-- =============================================
-- Stored Procedure: admin.sp_GetPlatformHealth
-- Description: Gets platform health metrics including DB stats, storage, and load
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPlatformHealth]'))
    DROP PROCEDURE [admin].[sp_GetPlatformHealth];
GO

CREATE PROCEDURE [admin].[sp_GetPlatformHealth]
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
        (SELECT COUNT(*) FROM vendors.VendorProfiles) as vendors,
        (SELECT COUNT(*) FROM users.Users) as users,
        (SELECT COUNT(*) FROM bookings.Bookings) as bookings,
        (SELECT COUNT(*) FROM vendors.Reviews) as reviews;
END
GO




