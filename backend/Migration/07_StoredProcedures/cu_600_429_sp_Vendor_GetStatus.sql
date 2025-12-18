-- =============================================
-- Stored Procedure: sp_Vendor_GetStatus
-- Description: Gets vendor registration status for a user
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetStatus]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetStatus];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetStatus]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.VendorProfileID,
        vp.IsVerified,
        CASE 
            WHEN vp.BusinessName IS NULL THEN 0
            WHEN vp.BusinessDescription IS NULL THEN 0
            WHEN vp.BusinessPhone IS NULL THEN 0
            WHEN vp.Address IS NULL THEN 0
            ELSE 1
        END AS IsProfileComplete
    FROM VendorProfiles vp
    WHERE vp.UserID = @UserID;
END
GO
