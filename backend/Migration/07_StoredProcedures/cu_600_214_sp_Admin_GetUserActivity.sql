-- =============================================
-- Stored Procedure: sp_Admin_GetUserActivity
-- Description: Gets user activity log for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetUserActivity]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetUserActivity];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetUserActivity]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get bookings
    SELECT TOP 10
        'booking' as type,
        b.BookingID as id,
        'Booking #' + CAST(b.BookingID as NVARCHAR) + ' - ' + vp.BusinessName as description,
        b.Status,
        b.CreatedAt as date
    FROM Bookings b
    JOIN VendorProfiles vp ON b.VendorProfileID = vp.VendorProfileID
    WHERE b.UserID = @UserID
    ORDER BY b.CreatedAt DESC;
    
    -- Get reviews
    SELECT TOP 10
        'review' as type,
        r.ReviewID as id,
        'Review for ' + vp.BusinessName + ' (' + CAST(r.Rating as NVARCHAR) + ' stars)' as description,
        'completed' as Status,
        r.CreatedAt as date
    FROM Reviews r
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE r.UserID = @UserID
    ORDER BY r.CreatedAt DESC;
END
GO
