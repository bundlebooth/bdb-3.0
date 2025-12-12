
-- NEW: Get all bookings for a specific user
CREATE   PROCEDURE sp_GetUserBookingsAll
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    ORDER BY EventDate DESC;
END;

GO

