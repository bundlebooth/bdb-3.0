-- =============================================
-- Stored Procedure: sp_Admin_GetRecentActivity
-- Description: Gets recent platform activity for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetRecentActivity]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetRecentActivity];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetRecentActivity]
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Recent vendor registrations
    SELECT TOP 3
        'vendor' as type,
        'New vendor registration: ' + BusinessName as description,
        CreatedAt as timestamp,
        'fa-user-plus' as icon,
        '#2dce89' as color
    FROM VendorProfiles
    ORDER BY CreatedAt DESC;
    
    -- Recent bookings
    SELECT TOP 3
        'booking' as type,
        'New booking confirmed: #BK-' + CAST(BookingID as NVARCHAR) as description,
        CreatedAt as timestamp,
        'fa-calendar-check' as icon,
        '#5e72e4' as color
    FROM Bookings
    ORDER BY CreatedAt DESC;
    
    -- Recent reviews
    SELECT TOP 3
        'review' as type,
        'New review submitted (' + CAST(r.Rating as NVARCHAR) + ' stars)' as description,
        r.CreatedAt as timestamp,
        'fa-star' as icon,
        '#fb6340' as color
    FROM Reviews r
    ORDER BY r.CreatedAt DESC;
END
GO
