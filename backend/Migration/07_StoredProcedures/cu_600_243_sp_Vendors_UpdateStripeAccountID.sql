-- =============================================
-- Stored Procedure: sp_Vendors_UpdateStripeAccountID
-- Description: Updates Stripe account ID for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendors_UpdateStripeAccountID]'))
    DROP PROCEDURE [dbo].[sp_Vendors_UpdateStripeAccountID];
GO

CREATE PROCEDURE [dbo].[sp_Vendors_UpdateStripeAccountID]
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
