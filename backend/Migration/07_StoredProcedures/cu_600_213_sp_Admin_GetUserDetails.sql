-- =============================================
-- Stored Procedure: sp_Admin_GetUserDetails
-- Description: Gets single user details for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetUserDetails]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetUserDetails];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetUserDetails]
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
        (SELECT COUNT(*) FROM Bookings WHERE UserID = u.UserID) as BookingCount,
        (SELECT COUNT(*) FROM Reviews WHERE UserID = u.UserID) as ReviewCount
    FROM Users u
    WHERE u.UserID = @UserID;
END
GO
