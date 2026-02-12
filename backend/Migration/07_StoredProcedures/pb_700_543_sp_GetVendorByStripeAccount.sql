-- =============================================
-- Stored Procedure: payments.sp_GetVendorByStripeAccount
-- Description: Get vendor info by Stripe account ID for payout emails
-- =============================================
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[payments].[sp_GetVendorByStripeAccount]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [payments].[sp_GetVendorByStripeAccount]
GO

CREATE PROCEDURE [payments].[sp_GetVendorByStripeAccount]
    @StripeAccountID NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        v.VendorProfileID, 
        v.BusinessName, 
        v.ContactEmail, 
        u.UserID
    FROM vendors.VendorProfiles v
    JOIN users.Users u ON v.UserID = u.UserID
    WHERE v.StripeAccountID = @StripeAccountID
END
GO
