
-- Get user notifications
CREATE   PROCEDURE sp_GetUserNotifications
    @UserID INT,
    @UnreadOnly BIT = 0,
    @Limit INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP (@Limit)
        n.NotificationID,
        n.Type,
        n.Title,
        n.Message,
        n.IsRead,
        n.ReadAt,
        n.RelatedID,
        n.RelatedType,
        n.ActionURL,
        n.CreatedAt,
        CASE 
            WHEN n.Type = 'booking' THEN (SELECT b.Status FROM Bookings b WHERE b.BookingID = n.RelatedID)
            ELSE NULL
        END AS Status
    FROM Notifications n
    WHERE n.UserID = @UserID
    AND (@UnreadOnly = 0 OR n.IsRead = 0)
    ORDER BY n.CreatedAt DESC;
    
    -- Mark as read if fetching unread
    IF @UnreadOnly = 1
    BEGIN
        UPDATE Notifications
        SET IsRead = 1,
            ReadAt = GETDATE()
        WHERE UserID = @UserID
        AND IsRead = 0;
    END
END;

GO

