-- =============================================
-- Stored Procedure: sp_Admin_GetPaymentStats
-- Description: Gets payment statistics
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetPaymentStats]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetPaymentStats];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetPaymentStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as totalRevenue,
        (SELECT ISNULL(SUM(TotalAmount * 0.1), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as platformFees,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM Bookings WHERE Status IN ('Confirmed', 'confirmed', 'Pending', 'pending')) as pendingPayouts,
        (SELECT ISNULL(SUM(TotalAmount * 0.9), 0) FROM Bookings WHERE Status IN ('Completed', 'completed')) as completedPayouts;
END
GO
