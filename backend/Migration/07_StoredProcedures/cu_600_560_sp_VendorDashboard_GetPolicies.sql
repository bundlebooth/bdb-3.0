-- =============================================
-- Stored Procedure: sp_VendorDashboard_GetPolicies
-- Description: Gets vendor policies
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_GetPolicies]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_GetPolicies];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_GetPolicies]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT DepositRequirements, CancellationPolicy, ReschedulingPolicy, PaymentMethods, PaymentTerms
    FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
