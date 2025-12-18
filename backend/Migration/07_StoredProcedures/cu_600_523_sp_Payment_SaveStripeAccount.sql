-- =============================================
-- Stored Procedure: sp_Payment_SaveStripeAccount
-- Description: Saves Stripe Connect account ID for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Payment_SaveStripeAccount]'))
    DROP PROCEDURE [dbo].[sp_Payment_SaveStripeAccount];
GO

CREATE PROCEDURE [dbo].[sp_Payment_SaveStripeAccount]
    @VendorProfileID INT,
    @StripeAccountID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET StripeAccountID = @StripeAccountID, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
