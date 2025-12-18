-- =============================================
-- Stored Procedure: sp_Admin_GetVendorOwnerInfo
-- Description: Gets vendor owner info and visibility status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorOwnerInfo]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorOwnerInfo];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorOwnerInfo]
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
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO
