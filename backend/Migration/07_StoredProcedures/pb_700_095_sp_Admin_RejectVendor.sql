-- =============================================
-- Stored Procedure: admin.sp_RejectVendor
-- Description: Rejects a vendor and hides them from the platform
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_RejectVendor]'))
    DROP PROCEDURE [admin].[sp_RejectVendor];
GO

CREATE PROCEDURE [admin].[sp_RejectVendor]
    @VendorProfileID INT,
    @Reason NVARCHAR(MAX) = NULL,
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET ProfileStatus = 'rejected', 
        IsVisible = 0,
        RejectionReason = @Reason,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

