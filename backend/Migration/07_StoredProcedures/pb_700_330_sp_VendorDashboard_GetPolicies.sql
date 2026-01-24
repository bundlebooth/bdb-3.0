-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetPolicies
-- Description: Gets vendor policies
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetPolicies]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetPolicies];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetPolicies]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT CancellationPolicy, ReschedulingPolicy
    FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

