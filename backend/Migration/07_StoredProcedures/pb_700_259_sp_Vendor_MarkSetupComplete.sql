-- =============================================
-- Stored Procedure: vendors.sp_MarkSetupComplete
-- Description: Marks vendor setup as complete
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_MarkSetupComplete]'))
    DROP PROCEDURE [vendors].[sp_MarkSetupComplete];
GO

CREATE PROCEDURE [vendors].[sp_MarkSetupComplete]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET IsCompleted = 1, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

