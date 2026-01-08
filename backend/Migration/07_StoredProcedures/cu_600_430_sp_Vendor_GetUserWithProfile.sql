-- =============================================
-- Stored Procedure: vendors.sp_GetUserWithProfile
-- Description: Gets user info with vendor profile ID
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetUserWithProfile]'))
    DROP PROCEDURE [vendors].[sp_GetUserWithProfile];
GO

CREATE PROCEDURE [vendors].[sp_GetUserWithProfile]
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
    FROM users.Users u
    LEFT JOIN vendors.VendorProfiles vp ON u.UserID = vp.UserID
    WHERE u.UserID = @UserID AND u.IsActive = 1;
END
GO


