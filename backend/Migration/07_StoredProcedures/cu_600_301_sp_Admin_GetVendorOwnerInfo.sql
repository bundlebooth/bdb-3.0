-- =============================================
-- Stored Procedure: admin.sp_GetVendorOwnerInfo
-- Description: Gets vendor owner info and visibility status
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorOwnerInfo]'))
    DROP PROCEDURE [admin].[sp_GetVendorOwnerInfo];
GO

CREATE PROCEDURE [admin].[sp_GetVendorOwnerInfo]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.Name as OwnerName, 
        u.Email as OwnerEmail, 
        u.Phone as OwnerPhone, 
        u.CreatedAt as UserCreatedAt,
        ISNULL(vp.IsVisible, 0) as IsVisible, 
        vp.ProfileStatus, 
        vp.AcceptingBookings, 
        vp.IsVerified
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO


