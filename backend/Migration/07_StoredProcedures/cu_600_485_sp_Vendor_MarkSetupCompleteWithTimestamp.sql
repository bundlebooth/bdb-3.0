-- =============================================
-- Stored Procedure: sp_Vendor_MarkSetupCompleteWithTimestamp
-- Description: Marks vendor setup as complete with timestamp
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_MarkSetupCompleteWithTimestamp]'))
    DROP PROCEDURE [dbo].[sp_Vendor_MarkSetupCompleteWithTimestamp];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_MarkSetupCompleteWithTimestamp]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET IsCompleted = 1,
        SetupCompletedAt = GETUTCDATE(),
        UpdatedAt = GETUTCDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
