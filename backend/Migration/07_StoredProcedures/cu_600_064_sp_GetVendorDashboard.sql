/*
    Migration Script: Create Stored Procedure [sp_GetVendorDashboard]
    Phase: 600 - Stored Procedures
    Script: cu_600_064_dbo.sp_GetVendorDashboard.sql
    Description: Creates the [vendors].[sp_GetDashboard] stored procedure
    
    Execution Order: 64
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetDashboard]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetDashboard]'))
    DROP PROCEDURE [vendors].[sp_GetDashboard];
GO

CREATE   PROCEDURE [vendors].[sp_GetDashboard]
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
    WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID)
    ORDER BY EventDate DESC;

    -- Recent reviews from view
    SELECT TOP 5 *
    FROM vw_VendorReviews
    WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID)
    ORDER BY CreatedAt DESC;

    -- Unread messages count from view
    SELECT COUNT(*) AS UnreadMessages
    FROM vw_VendorConversations
    WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID)
    AND UnreadCount > 0;

    -- Unread notifications count
    SELECT COUNT(*) AS UnreadNotifications
    FROM notifications.Notifications
    WHERE UserID = @UserID
    AND IsRead = 0;

    -- Quick stats
    SELECT 
        (SELECT COUNT(*) FROM bookings.Bookings WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID)) AS TotalBookings,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS TotalReviews,
        (SELECT AVG(CAST(Rating AS DECIMAL(3,1))) FROM vendors.Reviews WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID) AND IsApproved = 1) AS AvgRating,
        (SELECT COUNT(*) FROM users.Favorites WHERE VendorProfileID = (SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID)) AS TotalFavorites;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetDashboard] created successfully.';
GO





