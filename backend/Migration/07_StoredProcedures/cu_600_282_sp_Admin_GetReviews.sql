-- =============================================
-- Stored Procedure: sp_Admin_GetReviews
-- Description: Gets all reviews with filters for admin panel
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetReviews]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetReviews];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetReviews]
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
    FROM Reviews r
    JOIN Users u ON r.UserID = u.UserID
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Filter IS NULL OR
         (@Filter = 'flagged' AND r.IsFlagged = 1) OR
         (@Filter = 'recent' AND r.CreatedAt >= DATEADD(day, -7, GETDATE())))
        AND (@Search IS NULL OR r.Comment LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%')
    ORDER BY r.CreatedAt DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) as total
    FROM Reviews r
    JOIN VendorProfiles vp ON r.VendorProfileID = vp.VendorProfileID
    WHERE 
        (@Filter IS NULL OR
         (@Filter = 'flagged' AND r.IsFlagged = 1) OR
         (@Filter = 'recent' AND r.CreatedAt >= DATEADD(day, -7, GETDATE())))
        AND (@Search IS NULL OR r.Comment LIKE '%' + @Search + '%' OR vp.BusinessName LIKE '%' + @Search + '%');
END
GO
