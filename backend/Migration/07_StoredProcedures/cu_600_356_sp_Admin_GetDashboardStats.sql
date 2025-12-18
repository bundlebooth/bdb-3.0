-- =============================================
-- Stored Procedure: sp_Admin_GetDashboardStats
-- Description: Gets dashboard statistics for admin
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
        (SELECT COUNT(*) FROM Users) as totalUsers,
        (SELECT COUNT(*) FROM Users WHERE IsVendor = 1) as totalVendors,
        (SELECT COUNT(*) FROM Bookings) as totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as totalRevenue,
        (SELECT COUNT(*) FROM VendorProfiles WHERE ProfileStatus = 'pending_review') as pendingApprovals,
        (SELECT COUNT(*) FROM Reviews WHERE IsFlagged = 1) as flaggedReviews;
END
GO
