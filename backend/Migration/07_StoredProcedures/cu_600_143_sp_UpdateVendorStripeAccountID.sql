-- =============================================
-- Stored Procedure: sp_UpdateVendorStripeAccountID
-- Description: Updates the Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorStripeAccountID]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorStripeAccountID];
GO

CREATE PROCEDURE [dbo].[sp_UpdateVendorStripeAccountID]
    @VendorProfileID INT,
    @StripeAccountID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE VendorProfiles 
    SET StripeAccountID = @StripeAccountID, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
END
GO
