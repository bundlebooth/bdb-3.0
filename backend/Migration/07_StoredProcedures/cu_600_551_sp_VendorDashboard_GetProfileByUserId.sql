-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetProfileByUserId
-- Description: Gets vendor profile by user ID for setup status
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetProfileByUserId]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetProfileByUserId];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetProfileByUserId]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, LogoURL,
           DepositRequirements, PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified,
           IsVerified, IsCompleted, AcceptingBookings, GooglePlaceID,
           IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured
    FROM VendorProfiles WHERE UserID = @UserID;
END
GO
