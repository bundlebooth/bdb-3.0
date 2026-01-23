-- ============================================================
-- Save cookie consent preferences
-- ============================================================
IF OBJECT_ID('users.sp_SaveCookieConsent', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_SaveCookieConsent;
GO

CREATE PROCEDURE users.sp_SaveCookieConsent
    @UserID INT = NULL,
    @SessionID NVARCHAR(100) = NULL,
    @IPAddress NVARCHAR(50) = NULL,
    @NecessaryCookies BIT = 1,
    @AnalyticsCookies BIT = 0,
    @MarketingCookies BIT = 0,
    @FunctionalCookies BIT = 1,
    @UserAgent NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if consent already exists for this user/session
    DECLARE @ExistingID INT;
    
    IF @UserID IS NOT NULL
        SELECT @ExistingID = ConsentID FROM users.UserCookieConsent WHERE UserID = @UserID;
    ELSE IF @SessionID IS NOT NULL
        SELECT @ExistingID = ConsentID FROM users.UserCookieConsent WHERE SessionID = @SessionID AND UserID IS NULL;
    
    IF @ExistingID IS NOT NULL
    BEGIN
        UPDATE users.UserCookieConsent
        SET NecessaryCookies = @NecessaryCookies,
            AnalyticsCookies = @AnalyticsCookies,
            MarketingCookies = @MarketingCookies,
            FunctionalCookies = @FunctionalCookies,
            ConsentGiven = 1,
            LastUpdated = GETDATE(),
            IPAddress = ISNULL(@IPAddress, IPAddress),
            UserAgent = ISNULL(@UserAgent, UserAgent)
        WHERE ConsentID = @ExistingID;
    END
    ELSE
    BEGIN
        INSERT INTO users.UserCookieConsent (UserID, SessionID, IPAddress, NecessaryCookies, AnalyticsCookies, MarketingCookies, FunctionalCookies, ConsentGiven, UserAgent)
        VALUES (@UserID, @SessionID, @IPAddress, @NecessaryCookies, @AnalyticsCookies, @MarketingCookies, @FunctionalCookies, 1, @UserAgent);
    END
    
    SELECT 'success' AS Status, 'Cookie consent saved' AS Message;
END
GO
