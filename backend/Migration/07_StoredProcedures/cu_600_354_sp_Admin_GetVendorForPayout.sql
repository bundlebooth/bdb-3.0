-- =============================================
-- Stored Procedure: admin.sp_GetVendorForPayout
-- Description: Gets vendor details for payout processing
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorForPayout]'))
    DROP PROCEDURE [admin].[sp_GetVendorForPayout];
GO

CREATE PROCEDURE [admin].[sp_GetVendorForPayout]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT vp.BusinessName, vp.StripeAccountId, u.Email
    FROM vendors.VendorProfiles vp
    LEFT JOIN users.Users u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO


