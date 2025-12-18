-- =============================================
-- Stored Procedure: vendors.sp_VerifyInsertedService
-- Description: Verifies a service was inserted correctly
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_VerifyInsertedService]'))
    DROP PROCEDURE [vendors].[sp_VerifyInsertedService];
GO

CREATE PROCEDURE [vendors].[sp_VerifyInsertedService]
    @VendorProfileID INT,
    @LinkedPredefinedServiceID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT TOP 1 ServiceID, Name, Price, BaseRate, OvertimeRatePerHour, PricingModel, BaseDurationMinutes
    FROM vendors.Services
    WHERE VendorProfileID = @VendorProfileID 
    AND LinkedPredefinedServiceID = @LinkedPredefinedServiceID
    ORDER BY ServiceID DESC;
END
GO
