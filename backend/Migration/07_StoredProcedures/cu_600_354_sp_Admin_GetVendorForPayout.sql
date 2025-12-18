-- =============================================
-- Stored Procedure: sp_Admin_GetVendorForPayout
-- Description: Gets vendor details for payout processing
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorForPayout]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorForPayout];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorForPayout]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT vp.BusinessName, vp.StripeAccountId, u.Email
    FROM VendorProfiles vp
    LEFT JOIN Users u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO
