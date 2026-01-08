/*
    Migration Script: Create Stored Procedure [users].[sp_GetUserDashboard]
    Phase: 600 - Stored Procedures
    Script: cu_600_675_sp_Users_GetUserDashboard.sql
    Description: Creates the [users].[sp_GetUserDashboard] stored procedure
                 Used by GET /api/users/:id/dashboard endpoint
    
    Execution Order: 675
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetUserDashboard]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetUserDashboard]'))
    DROP PROCEDURE [users].[sp_GetUserDashboard];
GO

CREATE PROCEDURE [users].[sp_GetUserDashboard]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Recordset 0: User info
    SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.Phone,
        u.ProfileImageURL AS Avatar,
        u.Bio,
        u.IsVendor,
        u.IsAdmin,
        u.CreatedAt
    FROM users.Users u
    WHERE u.UserID = @UserID;
    
    -- Recordset 1: Upcoming bookings (next 30 days)
    SELECT TOP 5
        b.BookingID,
        b.VendorProfileID,
        vp.BusinessName AS VendorName,
        b.EventDate,
        b.EndDate,
        b.Status,
        b.TotalAmount,
        b.AttendeeCount,
        b.DepositPaid,
        b.FullAmountPaid,
        b.CreatedAt,
        b.UpdatedAt
    FROM bookings.Bookings b
    INNER JOIN vendors.VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.UserID = @UserID
      AND b.EventDate >= GETDATE()
      AND b.Status NOT IN ('cancelled', 'completed')
    ORDER BY b.EventDate ASC;
    
    -- Recordset 2: Recent favorites
    SELECT TOP 5
        f.FavoriteID,
        f.VendorProfileID,
        vp.BusinessName AS VendorName,
        vp.BusinessDescription,
        f.CreatedAt
    FROM users.Favorites f
    INNER JOIN vendors.VendorProfiles vp ON f.VendorProfileID = vp.VendorProfileID
    WHERE f.UserID = @UserID
    ORDER BY f.CreatedAt DESC;
    
    -- Recordset 3: Unread messages count
    SELECT COUNT(*) AS UnreadMessages
    FROM messages.Messages m
    INNER JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
    WHERE c.UserID = @UserID
      AND m.SenderID != @UserID
      AND m.IsRead = 0;
    
    -- Recordset 4: Unread notifications count
    SELECT COUNT(*) AS UnreadNotifications
    FROM notifications.Notifications
    WHERE UserID = @UserID
      AND IsRead = 0;
END;

GO

PRINT 'Stored procedure [users].[sp_GetUserDashboard] created successfully.';
GO
