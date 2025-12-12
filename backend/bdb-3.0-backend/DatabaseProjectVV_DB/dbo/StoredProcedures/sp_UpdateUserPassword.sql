
-- NEW: Update user password
CREATE   PROCEDURE sp_UpdateUserPassword
    @UserID INT,
    @PasswordHash NVARCHAR(255)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        PasswordHash = @PasswordHash,
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

