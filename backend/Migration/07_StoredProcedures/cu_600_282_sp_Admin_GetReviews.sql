-- =============================================
-- Stored Procedure: admin.sp_GetReviews
-- Description: Gets all reviews with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetReviews]'))
    DROP PROCEDURE [admin].[sp_GetReviews];
GO

CREATE PROCEDURE [admin].[sp_GetReviews]
    @Filter NVARCHAR(50) = NULL,
    @Search NVARCHAR(100) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        r.ReviewID,
        r.Rating,
        r.Comment as ReviewText,
        r.IsFlagged,
        r.FlagReason,
        r.AdminNotes,
        r.CreatedAt,
        u.Name as ReviewerName,
        u.Email as ReviewerEmail,
        vp.BusinessName as VendorName,
        vp.VendorProfileID,
        r.BookingID
    FROM vendors.Reviews r
    JOIN users.Users u ON r.UserID = u.UserID
    JOIN vendors.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Filter IS NULL OR
         (@Filter = 'flagged' AND r.IsFlagged = 1) OR
         (@Filter = 'recent' AND r.CreatedAt >= DATEADD(day, -7, GETDATE())))
        AND (@Search IS NULL OR r.Comment LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%')
    ORDER BY r.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) as total
    FROM vendors.Reviews r
    JOIN vendors.VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Filter IS NULL OR
         (@Filter = 'flagged' AND r.IsFlagged = 1) OR
         (@Filter = 'recent' AND r.CreatedAt >= DATEADD(day, -7, GETDATE())))
        AND (@Search IS NULL OR r.Comment LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%');
END
GO



