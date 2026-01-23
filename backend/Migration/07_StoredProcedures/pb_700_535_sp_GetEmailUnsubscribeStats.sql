-- ============================================================
-- Get email unsubscribe statistics for admin
-- ============================================================
IF OBJECT_ID('users.sp_GetEmailUnsubscribeStats', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_GetEmailUnsubscribeStats;
GO

CREATE PROCEDURE users.sp_GetEmailUnsubscribeStats
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        Category,
        COUNT(*) AS TotalUnsubscribes,
        SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveUnsubscribes,
        SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END) AS Resubscribed
    FROM users.EmailUnsubscribes
    GROUP BY Category
    ORDER BY TotalUnsubscribes DESC;
END
GO
