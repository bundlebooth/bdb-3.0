
-- Corrected stored procedure for vendor dashboard using views from SQL_V3.SQL

CREATE   PROCEDURE sp_GetVendorDashboard
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    -- Vendor profile info from view
    SELECT TOP 1 *
    FROM vw_VendorDetails
    WHERE UserID = @UserID;

    -- Recent bookings from view
    SELECT TOP 5 *
    FROM vw_VendorBookings
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    ORDER BY EventDate DESC;

    -- Recent reviews from view
    SELECT TOP 5 *
    FROM vw_VendorReviews
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    ORDER BY CreatedAt DESC;

    -- Unread messages count from view
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_VendorConversations
    WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)
    AND UnreadCount > 0;

    -- Unread notifications count
    SELECT COUNT(*) AS UnreadNotifications
    FROM Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;

    -- Quick stats
    SELECT 
        (SELECT COUNT(*) FROM Bookings WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)) AS TotalBookings,
        (SELECT COUNT(*) FROM Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS TotalReviews,
        (SELECT AVG(CAST(Rating AS DECIMAL(3,1))) FROM Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS AvgRating,
        (SELECT COUNT(*) FROM Favorites WHERE VendorProfileID = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID)) AS TotalFavorites;
END;

GO

