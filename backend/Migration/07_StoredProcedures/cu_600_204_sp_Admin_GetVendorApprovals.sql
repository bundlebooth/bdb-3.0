-- =============================================
-- Stored Procedure: admin.sp_GetVendorApprovals
-- Description: Gets vendor profiles for approval review
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorApprovals]'))
    DROP PROCEDURE [admin].[sp_GetVendorApprovals];
GO

CREATE PROCEDURE [admin].[sp_GetVendorApprovals]
    @Status NVARCHAR(50) = 'pending'
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.BusinessName,
        vp.DisplayName,
        vp.BusinessDescription,
        vp.BusinessPhone,
        vp.BusinessEmail,
        vp.Address,
        vp.City,
        vp.State,
        vp.PostalCode,
        vp.Country,
        vp.ProfileStatus,
        ISNULL(vp.IsVisible, 0) as IsVisible,
        vp.IsVerified,
        vp.AcceptingBookings,
        vp.CreatedAt,
        vp.UpdatedAt,
        vp.AdminNotes,
        vp.RejectionReason,
        u.Name as OwnerName,
        u.Email as OwnerEmail,
        u.Phone as OwnerPhone,
        (SELECT TOP 1 ImageURL FROM vendors.VendorImages WHERE VendorProfileID = vp.VendorProfileID AND IsPrimary = 1) as PrimaryImage,
        (SELECT TOP 1 Category FROM vendors.VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories,
        (SELECT COUNT(*) FROM vendors.VendorImages WHERE VendorProfileID = vp.VendorProfileID) as ImageCount,
        (SELECT COUNT(*) FROM vendors.VendorServices WHERE VendorProfileID = vp.VendorProfileID) as ServiceCount
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status = 'all') OR
        (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
        (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
        (@Status = 'rejected' AND vp.ProfileStatus = 'rejected')
    ORDER BY vp.CreatedAt DESC;
END
GO





