-- =============================================
-- Stored Procedure: admin.sp_GetDashboardStats
-- Description: Gets dashboard statistics for admin
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetDashboardStats]'))
    DROP PROCEDURE [admin].[sp_GetDashboardStats];
GO

CREATE PROCEDURE [admin].[sp_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        (SELECT COUNT(*) FROM users.Users) as totalUsers,
        (SELECT COUNT(*) FROM users.Users WHERE IsVendor = 1) as totalVendors,
        (SELECT COUNT(*) FROM bookings.Bookings) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE Status IN ('Completed', 'completed')) as totalRevenue,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingApprovals,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE IsFlagged = 1) as flaggedReviews;
END
GO




