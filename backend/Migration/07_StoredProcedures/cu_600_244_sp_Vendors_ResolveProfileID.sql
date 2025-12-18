-- =============================================
-- Stored Procedure: vendors.sp_ResolveProfileID
-- Description: Resolves UserID to VendorProfileID or validates VendorProfileID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_ResolveProfileID]'))
    DROP PROCEDURE [vendors].[sp_ResolveProfileID];
GO

CREATE PROCEDURE [vendors].[sp_ResolveProfileID]
    @ID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First try as direct VendorProfileID
    IF EXISTS (SELECT 1 FROM vendors.VendorProfiles WHERE VendorProfileID = @ID)
    BEGIN
        SELECT @ID AS VendorProfileID;
        RETURN;
    END
    
    -- Try to get VendorProfileID from UserID
    SELECT vp.VendorProfileID
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @ID AND u.IsActive = 1 AND u.IsVendor = 1 AND vp.VendorProfileID IS NOT NULL;
END
GO


