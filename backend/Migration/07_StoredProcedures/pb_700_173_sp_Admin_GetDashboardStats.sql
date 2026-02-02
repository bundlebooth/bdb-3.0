-- =============================================
-- Stored Procedure: admin.sp_GetDashboardStats
-- Description: Gets dashboard statistics for admin
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetDashboardStats]'))
    DROP PROCEDURE [admin].[sp_GetDashboardStats];
GO

CREATE PROCEDURE [admin].[sp_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartOfMonth DATETIME = DATEADD(month, DATEDIFF(month, 0, GETDATE()), 0);
    DECLARE @StartOfLastMonth DATETIME = DATEADD(month, -1, @StartOfMonth);
    
    SELECT
        (SELECT COUNT(*) FROM users.Users) as totalUsers,
        (SELECT COUNT(*) FROM users.Users WHERE CreatedAt >= @StartOfMonth) as newUsersThisMonth,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'approved' AND IsVisible = 1) as activeVendors,
        (SELECT COUNT(*) FROM users.Users WHERE IsVendor = 1) as totalVendors,
        (SELECT COUNT(*) FROM bookings.Bookings) as totalBookings,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE CreatedAt >= @StartOfMonth) as bookingsThisMonth,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE Status IN ('Completed', 'completed', 'confirmed')) as totalRevenue,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE CreatedAt >= @StartOfMonth) as revenueThisMonth,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingApprovals,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE IsFlagged = 1) as flaggedReviews,
        (SELECT COUNT(*) FROM admin.SupportTickets WHERE Status = 'open') as openTickets,
        (SELECT COUNT(*) FROM users.Users WHERE IsLocked = 1) as lockedAccounts;
END
GO




