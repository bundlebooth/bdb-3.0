-- ============================================================
-- Get cookie consent preferences for a user
-- ============================================================
IF OBJECT_ID('users.sp_GetUserCookieConsent', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_GetUserCookieConsent;
GO

CREATE PROCEDURE users.sp_GetUserCookieConsent
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 
        ConsentID,
        UserID,
        SessionID,
        NecessaryCookies,
        AnalyticsCookies,
        MarketingCookies,
        FunctionalCookies,
        ConsentGiven,
        ConsentDate,
        LastUpdated
    FROM users.UserCookieConsent
    WHERE UserID = @UserID
    ORDER BY LastUpdated DESC, ConsentDate DESC;
END
GO
