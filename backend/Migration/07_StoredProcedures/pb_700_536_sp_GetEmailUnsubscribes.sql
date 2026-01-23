-- ============================================================
-- Get all email unsubscribes for admin with pagination
-- ============================================================
IF OBJECT_ID('users.sp_GetEmailUnsubscribes', 'P') IS NOT NULL
    DROP PROCEDURE users.sp_GetEmailUnsubscribes;
GO

CREATE PROCEDURE users.sp_GetEmailUnsubscribes
    @Category NVARCHAR(50) = NULL,
    @IsActive BIT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UnsubscribeID,
        u.Email,
        u.Category,
        u.UnsubscribedAt,
        u.ResubscribedAt,
        u.IsActive,
        u.IPAddress,
        usr.FirstName + ' ' + usr.LastName AS UserName
    FROM users.EmailUnsubscribes u
    LEFT JOIN users.Users usr ON u.UserID = usr.UserID
    WHERE (@Category IS NULL OR u.Category = @Category)
      AND (@IsActive IS NULL OR u.IsActive = @IsActive)
    ORDER BY u.UnsubscribedAt DESC
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
END
GO
