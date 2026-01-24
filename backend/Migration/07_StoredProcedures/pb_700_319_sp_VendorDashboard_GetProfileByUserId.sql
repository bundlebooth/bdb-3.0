-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetProfileByUserId
-- Description: Gets vendor profile by user ID for setup status
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetProfileByUserId]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetProfileByUserId];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetProfileByUserId]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, LogoURL,
           LicenseNumber, InsuranceVerified,
           IsVerified, IsCompleted, AcceptingBookings, GooglePlaceID,
           IsPremium, IsEcoFriendly, IsAwardWinning, IsLastMinute, IsCertified, IsInsured
    FROM vendors.VendorProfiles WHERE UserID = @UserID;
END
GO

