-- =============================================
-- Stored Procedure: vendors.sp_UpdatePolicies
-- Description: Updates vendor policies and preferences
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdatePolicies]'))
    DROP PROCEDURE [vendors].[sp_UpdatePolicies];
GO

CREATE PROCEDURE [vendors].[sp_UpdatePolicies]
    @VendorProfileID INT,
    @CancellationPolicy NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET CancellationPolicy = @CancellationPolicy,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

