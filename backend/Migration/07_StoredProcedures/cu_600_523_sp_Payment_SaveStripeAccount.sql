-- =============================================
-- Stored Procedure: payments.sp_SaveStripeAccount
-- Description: Saves Stripe Connect account ID for vendor
-- Phase: 600 (Stored Procedures)
-- Schema: payments
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[payments].[sp_SaveStripeAccount]'))
    DROP PROCEDURE [payments].[sp_SaveStripeAccount];
GO

CREATE PROCEDURE [payments].[sp_SaveStripeAccount]
    @VendorProfileID INT,
    @StripeAccountID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET StripeAccountID = @StripeAccountID, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

