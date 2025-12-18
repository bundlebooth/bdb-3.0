-- =============================================
-- Stored Procedure: sp_Vendor_MarkSetupComplete
-- Description: Marks vendor setup as complete
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_MarkSetupComplete]'))
    DROP PROCEDURE [dbo].[sp_Vendor_MarkSetupComplete];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_MarkSetupComplete]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET IsCompleted = 1, UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
