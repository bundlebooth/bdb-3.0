-- =============================================
-- Stored Procedure: vendors.sp_MarkSetupCompleteWithTimestamp
-- Description: Marks vendor setup as complete with timestamp
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_MarkSetupCompleteWithTimestamp]'))
    DROP PROCEDURE [vendors].[sp_MarkSetupCompleteWithTimestamp];
GO

CREATE PROCEDURE [vendors].[sp_MarkSetupCompleteWithTimestamp]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET IsCompleted = 1,
        SetupCompletedAt = GETUTCDATE(),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

