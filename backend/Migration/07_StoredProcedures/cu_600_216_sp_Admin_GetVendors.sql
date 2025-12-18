-- =============================================
-- Stored Procedure: sp_Admin_GetVendors
-- Description: Gets all vendors with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendors]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendors];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendors]
    @Status NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription as Description,
        vp.City,
        vp.State,
        CASE 
            WHEN vp.ProfileStatus = 'pending_review' THEN 'Pending'
            WHEN vp.ProfileStatus = 'approved' THEN 'Approved'
            WHEN vp.ProfileStatus = 'rejected' THEN 'Rejected'
            WHEN vp.AcceptingBookings = 0 THEN 'Suspended'
            ELSE vp.ProfileStatus
        END as ProfileStatus,
        vp.AcceptingBookings as IsActive,
        ISNULL(vp.IsVisible, 0) as IsVisible,
        vp.IsVerified,
        vp.CreatedAt,
        u.Email as OwnerEmail,
        u.Name as OwnerName,
        (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID AND IsPrimary = 1) as PrimaryImage,
        vp.AvgRating as AverageRating,
        vp.TotalReviews as ReviewCount,
        vp.TotalBookings as BookingCount,
        (SELECT TOP 1 Category FROM VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
         (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
         (@Status = 'rejected' AND vp.ProfileStatus = 'rejected') OR
         (@Status = 'suspended' AND vp.AcceptingBookings = 0) OR
         (@Status = 'visible' AND ISNULL(vp.IsVisible, 0) = 1) OR
         (@Status = 'hidden' AND ISNULL(vp.IsVisible, 0) = 0))
        AND (@Search IS NULL OR vp.BusinessName LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%')
    ORDER BY vp.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) as total
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status IS NULL OR @Status = 'all' OR
         (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
         (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
         (@Status = 'rejected' AND vp.ProfileStatus = 'rejected') OR
         (@Status = 'suspended' AND vp.AcceptingBookings = 0) OR
         (@Status = 'visible' AND ISNULL(vp.IsVisible, 0) = 1) OR
         (@Status = 'hidden' AND ISNULL(vp.IsVisible, 0) = 0))
        AND (@Search IS NULL OR vp.BusinessName LIKE '%' + @Search + '%' OR u.Email LIKE '%' + @Search + '%');
END
GO
