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

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetDashboard]'))
    DROP PROCEDURE [vendors].[sp_GetDashboard];
GO

CREATE PROCEDURE [vendors].[sp_GetDashboard]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @VendorProfileID INT;
    SELECT @VendorProfileID = VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID;

    -- Vendor profile info from view (with schema qualification)
    SELECT TOP 1 *
    FROM vendors.vw_VendorDetails
    WHERE UserID = @UserID;

    -- Recent bookings from view (with schema qualification)
    SELECT TOP 5 *
    FROM bookings.vw_VendorBookings
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY EventDate DESC;

    -- Recent reviews from view (with schema qualification)
    SELECT TOP 5 *
    FROM vendors.vw_VendorReviews
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY CreatedAt DESC;

    -- Unread messages count (with schema qualification)
    SELECT COUNT(*) AS UnreadMessages
    FROM messages.Messages m
    JOIN messages.Conversations c ON m.ConversationID = c.ConversationID
    WHERE c.VendorProfileID = @VendorProfileID
      AND m.IsRead = 0
      AND m.SenderID != (SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID);

    -- Unread notifications count (with schema qualification)
    SELECT COUNT(*) AS UnreadNotifications
    FROM notifications.Notifications
    WHERE UserID = @UserID AND IsRead = 0;

    -- Stats (with schema qualification)
    SELECT 
        (SELECT COUNT(*) FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID) AS totalBookings,
        (SELECT ISNULL(SUM(TotalAmount), 0) FROM bookings.Bookings WHERE VendorProfileID = @VendorProfileID AND Status = 'completed') AS totalRevenue,
        (SELECT ISNULL(AVG(CAST(Rating AS FLOAT)), 0) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID) AS averageRating,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE VendorProfileID = @VendorProfileID) AS totalReviews;
END;

GO

PRINT 'Stored procedure [vendors].[sp_GetDashboard] created successfully.';
GO





