-- ============================================================
-- Check if email is unsubscribed from a category
-- ============================================================
IF OBJECT_ID('users.sp_IsEmailUnsubscribed', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_IsEmailUnsubscribed;
GO

CREATE PROCEDURE users.sp_IsEmailUnsubscribed
    @Email NVARCHAR(255),
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM users.EmailUnsubscribes WHERE Email = @Email AND (Category = @Category OR Category = 'all') AND IsActive = 1)
        SELECT 1 AS IsUnsubscribed;
    ELSE
        SELECT 0 AS IsUnsubscribed;
END
GO
