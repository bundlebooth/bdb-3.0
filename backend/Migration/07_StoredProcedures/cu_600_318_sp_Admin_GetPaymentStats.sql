-- =============================================
-- Stored Procedure: admin.sp_GetPaymentStats
-- Description: Gets payment statistics
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPaymentStats]'))
    DROP PROCEDURE [admin].[sp_GetPaymentStats];
GO

CREATE PROCEDURE [admin].[sp_GetPaymentStats]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE Status IN ('Completed', 'completed')) as totalRevenue,
        (SELECT ISNULL(SUM(TotalAmount * 0.1), 0) FROM bookings.Bookings WHERE Status IN ('Completed', 'completed')) as platformFees,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE Status IN ('Confirmed', 'confirmed', 'Pending', 'pending')) as pendingPayouts,
        (SELECT ISNULL(SUM(TotalAmount * 0.9), 0) FROM bookings.Bookings WHERE Status IN ('Completed', 'completed')) as completedPayouts;
END
GO

