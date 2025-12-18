-- =============================================
-- Stored Procedure: sp_Vendors_GetStripeAccountID
-- Description: Gets Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendors_GetStripeAccountID]'))
    DROP PROCEDURE [dbo].[sp_Vendors_GetStripeAccountID];
GO

CREATE PROCEDURE [dbo].[sp_Vendors_GetStripeAccountID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
