-- =============================================
-- Stored Procedure: sp_Vendor_GetProfileForSetup
-- Description: Gets vendor profile data for setup status calculation
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetProfileForSetup]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetProfileForSetup];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetProfileForSetup]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, LogoURL,
           PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified, IsCompleted, AcceptingBookings
    FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
