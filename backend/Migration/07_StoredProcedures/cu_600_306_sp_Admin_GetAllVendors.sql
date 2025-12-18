-- =============================================
-- Stored Procedure: admin.sp_GetAllVendors
-- Description: Gets all vendors with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetAllVendors]'))
    DROP PROCEDURE [admin].[sp_GetAllVendors];
GO

CREATE PROCEDURE [admin].[sp_GetAllVendors]
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    -- Main query
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.ProfileStatus,
        vp.CreatedAt,
        vp.UpdatedAt,
        ISNULL(vp.IsVisible, 0) as IsVisible,
        vp.AcceptingBookings,
        vp.IsVerified,
        vp.TotalBookings,
        vp.TotalReviews,
        vp.AvgRating,
        u.UserID,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        (SELECT TOP 1 Category FROM vendors.VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as PrimaryCategory
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
         (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
         (@Status = 'rejected' AND vp.ProfileStatus = 'rejected') OR
         (@Status = 'suspended' AND vp.AcceptingBookings = 0) OR
         (@Status = 'visible' AND ISNULL(vp.IsVisible, 0) = 1) OR
         (@Status = 'hidden' AND ISNULL(vp.IsVisible, 0) = 0) OR
         (vp.ProfileStatus = @Status))
        AND (@Search IS NULL OR vp.BusinessName LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%')
    ORDER BY vp.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Count query
    SELECT COUNT(*) as total
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
         (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
         (@Status = 'rejected' AND vp.ProfileStatus = 'rejected') OR
         (@Status = 'suspended' AND vp.AcceptingBookings = 0) OR
         (@Status = 'visible' AND ISNULL(vp.IsVisible, 0) = 1) OR
         (@Status = 'hidden' AND ISNULL(vp.IsVisible, 0) = 0) OR
         (vp.ProfileStatus = @Status))
        AND (@Search IS NULL OR vp.BusinessName LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%');
END
GO



