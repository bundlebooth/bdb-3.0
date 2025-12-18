-- =============================================
-- Stored Procedure: sp_Vendor_GetUserWithProfile
-- Description: Gets user info with vendor profile ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetUserWithProfile]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetUserWithProfile];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetUserWithProfile]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        u.UserID,
        u.Name,
        u.Email,
        u.IsVendor,
        vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID AND u.IsActive = 1;
END
GO
