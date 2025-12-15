-- =============================================
-- Stored Procedure: sp_GetVendorStripeAccountID
-- Description: Gets the Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorStripeAccountID]'))
    DROP PROCEDURE [dbo].[sp_GetVendorStripeAccountID];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorStripeAccountID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT StripeAccountID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
