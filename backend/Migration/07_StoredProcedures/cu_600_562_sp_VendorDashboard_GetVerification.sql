-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetVerification
-- Description: Gets vendor verification info
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetVerification]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetVerification];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetVerification]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT LicenseNumber, InsuranceVerified, Awards, Certifications, IsEcoFriendly, IsPremium, IsAwardWinning, IsLastMinute
    FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
