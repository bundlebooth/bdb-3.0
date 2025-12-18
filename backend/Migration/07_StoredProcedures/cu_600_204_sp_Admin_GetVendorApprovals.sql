-- =============================================
-- Stored Procedure: sp_Admin_GetVendorApprovals
-- Description: Gets vendor profiles for approval review
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorApprovals]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorApprovals];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorApprovals]
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
        (SELECT TOP 1 ImageURL FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID AND IsPrimary = 1) as PrimaryImage,
        (SELECT TOP 1 Category FROM VendorCategories WHERE VendorProfileID = vp.VendorProfileID) as Categories,
        (SELECT COUNT(*) FROM VendorImages WHERE VendorProfileID = vp.VendorProfileID) as ImageCount,
        (SELECT COUNT(*) FROM VendorServices WHERE VendorProfileID = vp.VendorProfileID) as ServiceCount
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    WHERE 
        (@Status = 'all') OR
        (@Status = 'pending' AND vp.ProfileStatus = 'pending_review') OR
        (@Status = 'approved' AND vp.ProfileStatus = 'approved') OR
        (@Status = 'rejected' AND vp.ProfileStatus = 'rejected')
    ORDER BY vp.CreatedAt DESC;
END
GO
