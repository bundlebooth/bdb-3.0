-- ============================================================
-- Resubscribe email
-- ============================================================
IF OBJECT_ID('users.sp_ResubscribeEmail', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_ResubscribeEmail;
GO

CREATE PROCEDURE users.sp_ResubscribeEmail
    @Email NVARCHAR(255),
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE users.EmailUnsubscribes
    SET IsActive = 0, ResubscribedAt = GETDATE()
    WHERE Email = @Email AND Category = @Category AND IsActive = 1;
    
    IF @@ROWCOUNT = 0
        SELECT 'not_found' AS Status, 'No active unsubscribe found' AS Message;
    ELSE
        SELECT 'success' AS Status, 'Successfully resubscribed' AS Message;
END
GO
