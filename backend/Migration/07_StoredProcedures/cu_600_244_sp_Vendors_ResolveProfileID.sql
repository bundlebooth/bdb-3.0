-- =============================================
-- Stored Procedure: sp_Vendors_ResolveProfileID
-- Description: Resolves UserID to VendorProfileID or validates VendorProfileID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendors_ResolveProfileID]'))
    DROP PROCEDURE [dbo].[sp_Vendors_ResolveProfileID];
GO

CREATE PROCEDURE [dbo].[sp_Vendors_ResolveProfileID]
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
    
    -- Try to get VendorProfileID from UserID
    SELECT vp.VendorProfileID
    FROM Users u
    LEFT JOIN VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @ID AND u.IsActive = 1 AND u.IsVendor = 1 AND vp.VendorProfileID IS NOT NULL;
END
GO
