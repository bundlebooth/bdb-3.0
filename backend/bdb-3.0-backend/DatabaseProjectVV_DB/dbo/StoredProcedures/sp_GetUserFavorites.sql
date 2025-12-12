
-- Corrected stored procedure for user favorites

CREATE   PROCEDURE sp_GetUserFavorites
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
END;

GO

