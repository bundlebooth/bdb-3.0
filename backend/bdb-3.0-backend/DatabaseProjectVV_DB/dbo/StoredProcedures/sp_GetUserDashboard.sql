
-- Get user dashboard data
CREATE   PROCEDURE sp_GetUserDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- User info
    SELECT 
        UserID,
        Name,
        Email,
        ProfileImageURL,
        Phone,
        IsVendor
    FROM Users
    WHERE UserID = @UserID;
    
    -- Upcoming bookings
    SELECT TOP 5 *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    AND EventDate >= GETDATE()
    AND Status NOT IN ('cancelled', 'rejected')
    ORDER BY EventDate;
    
    -- Recent favorites
    SELECT TOP 5 *
    FROM vw_UserFavorites
    WHERE UserID = @UserID
    ORDER BY CreatedAt DESC;
    
    -- Unread messages
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_UserConversations
    WHERE UserID = @UserID
    AND UnreadCount > 0;
    
    -- Unread notifications
    SELECT COUNT(*) AS UnreadNotifications
    FROM Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;
END;

GO

