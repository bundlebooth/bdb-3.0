-- =============================================
-- Stored Procedure: sp_Admin_GetVendorStripeAccount
-- Description: Gets vendor Stripe account ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorStripeAccount]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorStripeAccount];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorStripeAccount]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountId 
    FROM VendorProfiles 
    WHERE VendorProfileID = @VendorProfileID;
END
GO
