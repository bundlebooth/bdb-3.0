-- =============================================
-- Stored Procedure: sp_Vendor_ResolveProfileId
-- Description: Resolves UserID or VendorProfileID to VendorProfileID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_ResolveProfileId]'))
    DROP PROCEDURE [dbo].[sp_Vendor_ResolveProfileId];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_ResolveProfileId]
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First try as direct VendorProfileID
    IF EXISTS (SELECT 1 FROM VendorProfiles WHERE VendorProfileID = @ID)
    BEGIN
        SELECT @ID AS VendorProfileID;
        RETURN;
    END
    
    -- If not found, try as UserID
    SELECT vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @ID AND u.IsActive = 1 AND u.IsVendor = 1 AND vp.VendorProfileID IS NOT NULL;
END
GO
