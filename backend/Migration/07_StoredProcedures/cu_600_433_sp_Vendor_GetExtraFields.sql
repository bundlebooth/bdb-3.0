-- =============================================
-- Stored Procedure: vendors.sp_GetExtraFields
-- Description: Gets extra profile fields including Stripe, Google, and filters
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetExtraFields]'))
    DROP PROCEDURE [vendors].[sp_GetExtraFields];
GO

CREATE PROCEDURE [vendors].[sp_GetExtraFields]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT StripeAccountID, GooglePlaceId, ProfileStatus, RejectionReason, IsPremium,
           IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO

