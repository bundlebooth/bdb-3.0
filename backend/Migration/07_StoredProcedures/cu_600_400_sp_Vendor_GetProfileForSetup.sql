-- =============================================
-- Stored Procedure: vendors.sp_GetProfileForSetup
-- Description: Gets vendor profile data for setup status calculation
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetProfileForSetup]'))
    DROP PROCEDURE [vendors].[sp_GetProfileForSetup];
GO

CREATE PROCEDURE [vendors].[sp_GetProfileForSetup]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID, BusinessName, BusinessEmail, BusinessPhone, Address, LogoURL,
           PaymentMethods, PaymentTerms, LicenseNumber, InsuranceVerified, IsCompleted, AcceptingBookings
    FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

