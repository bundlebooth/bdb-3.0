-- =============================================
-- Stored Procedure: admin.sp_GetDashboardStats
-- Description: Gets admin dashboard overview statistics
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
        (SELECT COUNT(*) FROM vendors.VendorProfiles) as totalVendors,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingVendors,
        (SELECT COUNT(*) FROM users.Users WHERE IsActive = 1) as totalUsers,
        (SELECT COUNT(*) FROM bookings.Bookings) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE CreatedAt >= DATEADD(month, -1, GETDATE())) as monthlyRevenue,
        (SELECT COUNT(*) FROM vendors.VendorProfiles WHERE ProfileStatus = 'approved') as activeListings;
END
GO



