
-- NEW: Get full user profile details for settings
CREATE   PROCEDURE sp_GetUserProfileDetails
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        UserID,
        Name,
        Email,
        Phone,
        Bio,
        ProfileImageURL,
        IsVendor
    FROM Users
    WHERE UserID = @UserID;
END;

GO

