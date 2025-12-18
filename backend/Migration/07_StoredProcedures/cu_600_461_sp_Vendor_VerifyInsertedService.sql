-- =============================================
-- Stored Procedure: sp_Vendor_VerifyInsertedService
-- Description: Verifies a service was inserted correctly
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_VerifyInsertedService]'))
    DROP PROCEDURE [dbo].[sp_Vendor_VerifyInsertedService];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_VerifyInsertedService]
    @VendorProfileID INT,
    @LinkedPredefinedServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 ServiceID, Name, Price, BaseRate, OvertimeRatePerHour, PricingModel, BaseDurationMinutes
    FROM Services
    WHERE VendorProfileID = @VendorProfileID 
    AND LinkedPredefinedServiceID = @LinkedPredefinedServiceID
    ORDER BY ServiceID DESC;
END
GO
