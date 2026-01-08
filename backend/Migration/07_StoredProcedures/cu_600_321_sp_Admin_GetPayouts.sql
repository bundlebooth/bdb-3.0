-- =============================================
-- Stored Procedure: admin.sp_GetPayouts
-- Description: Gets vendor payouts with pagination
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPayouts]'))
    DROP PROCEDURE [admin].[sp_GetPayouts];
GO

CREATE PROCEDURE [admin].[sp_GetPayouts]
    @Filter NVARCHAR(50) = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 20
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;
    
    SELECT 
        vp.VendorProfileID as PayoutID,
        vp.BusinessName as VendorName,
        u.Email as VendorEmail,
        ISNULL(SUM(b.TotalAmount * 0.9), 0) as Amount,
        'completed' as Status,
        MAX(b.CreatedAt) as ProcessedAt
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    LEFT JOIN bookings.Bookings b ON vp.VendorProfileID = b.VendorProfileID AND b.Status IN ('Completed', 'completed')
    WHERE vp.ProfileStatus = 'approved'
    GROUP BY vp.VendorProfileID, vp.BusinessName, u.Email
    HAVING SUM(b.TotalAmount) > 0
    ORDER BY MAX(b.CreatedAt) DESC
    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
    
    SELECT COUNT(*) as total FROM vendors.VendorProfiles WHERE ProfileStatus = 'approved';
END
GO



