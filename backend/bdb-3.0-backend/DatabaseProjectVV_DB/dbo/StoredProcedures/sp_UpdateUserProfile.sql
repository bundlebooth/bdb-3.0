
-- NEW: Update user profile details
CREATE   PROCEDURE sp_UpdateUserProfile
    @UserID INT,
    @Name NVARCHAR(100) = NULL,
    @Phone NVARCHAR(20) = NULL,
    @Bio NVARCHAR(MAX) = NULL,
    @ProfileImageURL NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE Users
    SET 
        Name = ISNULL(@Name, Name),
        Phone = ISNULL(@Phone, Phone),
        Bio = ISNULL(@Bio, Bio),
        ProfileImageURL = ISNULL(@ProfileImageURL, ProfileImageURL),
        UpdatedAt = GETDATE()
    WHERE UserID = @UserID;

    SELECT 1 AS Success;
END;

GO

