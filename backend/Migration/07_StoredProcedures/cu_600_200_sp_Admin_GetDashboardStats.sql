-- =============================================
-- Stored Procedure: sp_Admin_GetDashboardStats
-- Description: Gets admin dashboard overview statistics
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetDashboardStats]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetDashboardStats];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetDashboardStats]
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        (SELECT COUNT(*) FROM VendorProfiles) as totalVendors,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingVendors,
        (SELECT COUNT(*) FROM Users WHERE IsActive = 1) as totalUsers,
        (SELECT COUNT(*) FROM Bookings) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE CreatedAt >= DATEADD(month, -1, GETDATE())) as monthlyRevenue,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'approved') as activeListings;
END
GO
