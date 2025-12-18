-- =============================================
-- Stored Procedure: admin.sp_GetUserDetails
-- Description: Gets single user details for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetUserDetails]'))
    DROP PROCEDURE [admin].[sp_GetUserDetails];
GO

CREATE PROCEDURE [admin].[sp_GetUserDetails]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Email,
        u.Name,
        u.Phone,
        u.IsVendor,
        u.IsAdmin,
        u.IsActive,
        u.CreatedAt,
        u.LastLogin,
        u.EmailVerified,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE UserID = u.UserID) as BookingCount,
        (SELECT COUNT(*) FROM vendors.Reviews WHERE UserID = u.UserID) as ReviewCount
    FROM users.Users u
    WHERE u.UserID = @UserID;
END
GO



