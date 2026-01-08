-- =============================================
-- Stored Procedure: admin.sp_GetUsers
-- Description: Gets all users with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetUsers]'))
    DROP PROCEDURE [admin].[sp_GetUsers];
GO

CREATE PROCEDURE [admin].[sp_GetUsers]
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        u.UserID,
        u.Email,
        u.Name,
        u.IsVendor,
        u.IsAdmin,
        u.IsActive,
        u.CreatedAt,
        u.LastLogin as LastLoginAt,
        (SELECT COUNT(*) FROM bookings.Bookings WHERE UserID = u.UserID) as BookingCount
    FROM users.Users u
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'active' AND u.IsActive = 1) OR
         (@Status = 'inactive' AND u.IsActive = 0) OR
         (@Status = 'vendors' AND u.IsVendor = 1) OR
         (@Status = 'clients' AND u.IsVendor = 0))
        AND (@Search IS NULL OR u.Email LIKE '%' + @Search + '%' OR u.Name LIKE '%' + @Search + '%')
    ORDER BY u.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) as total
    FROM users.Users u
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'active' AND u.IsActive = 1) OR
         (@Status = 'inactive' AND u.IsActive = 0) OR
         (@Status = 'vendors' AND u.IsVendor = 1) OR
         (@Status = 'clients' AND u.IsVendor = 0))
        AND (@Search IS NULL OR u.Email LIKE '%' + @Search + '%' OR u.Name LIKE '%' + @Search + '%');
END
GO


