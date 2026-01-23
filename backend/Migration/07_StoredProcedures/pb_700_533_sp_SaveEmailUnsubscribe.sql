-- ============================================================
-- Save email unsubscribe
-- ============================================================
IF OBJECT_ID('users.sp_SaveEmailUnsubscribe', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_SaveEmailUnsubscribe;
GO

CREATE PROCEDURE users.sp_SaveEmailUnsubscribe
    @Email NVARCHAR(255),
    @Category NVARCHAR(50),
    @UserID INT = NULL,
    @IPAddress NVARCHAR(50) = NULL,
    @UnsubscribeToken NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if already unsubscribed
    IF EXISTS (SELECT 1 FROM users.EmailUnsubscribes WHERE Email = @Email AND Category = @Category AND IsActive = 1)
    BEGIN
        SELECT 'exists' AS Status, 'Already unsubscribed from this category' AS Message;
        RETURN;
    END
    
    -- Check if previously unsubscribed but resubscribed
    DECLARE @ExistingID INT;
    SELECT @ExistingID = UnsubscribeID FROM users.EmailUnsubscribes WHERE Email = @Email AND Category = @Category AND IsActive = 0;
    
    IF @ExistingID IS NOT NULL
    BEGIN
        UPDATE users.EmailUnsubscribes
        SET IsActive = 1, UnsubscribedAt = GETDATE(), ResubscribedAt = NULL, IPAddress = @IPAddress
        WHERE UnsubscribeID = @ExistingID;
    END
    ELSE
    BEGIN
        INSERT INTO users.EmailUnsubscribes (Email, Category, UserID, IPAddress, UnsubscribeToken)
        VALUES (@Email, @Category, @UserID, @IPAddress, @UnsubscribeToken);
    END
    
    SELECT 'success' AS Status, 'Successfully unsubscribed' AS Message;
END
GO
