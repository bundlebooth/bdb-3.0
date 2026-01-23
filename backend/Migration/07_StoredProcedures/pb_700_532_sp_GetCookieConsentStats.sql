-- ============================================================
-- Get cookie consent statistics for admin
-- ============================================================
IF OBJECT_ID('users.sp_GetCookieConsentStats', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_GetCookieConsentStats;
GO

CREATE PROCEDURE users.sp_GetCookieConsentStats
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        COUNT(*) AS TotalConsents,
        SUM(CASE WHEN ConsentGiven = 1 THEN 1 ELSE 0 END) AS ConsentGiven,
        SUM(CASE WHEN AnalyticsCookies = 1 THEN 1 ELSE 0 END) AS AnalyticsAccepted,
        SUM(CASE WHEN MarketingCookies = 1 THEN 1 ELSE 0 END) AS MarketingAccepted,
        SUM(CASE WHEN FunctionalCookies = 1 THEN 1 ELSE 0 END) AS FunctionalAccepted,
        CAST(CAST(SUM(CASE WHEN AnalyticsCookies = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100 AS DECIMAL(5,2)) AS AnalyticsAcceptRate,
        CAST(CAST(SUM(CASE WHEN MarketingCookies = 1 THEN 1 ELSE 0 END) AS FLOAT) / NULLIF(COUNT(*), 0) * 100 AS DECIMAL(5,2)) AS MarketingAcceptRate
    FROM users.UserCookieConsent;
END
GO
