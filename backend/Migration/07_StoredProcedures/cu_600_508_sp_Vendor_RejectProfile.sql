-- =============================================
-- Stored Procedure: vendors.sp_RejectProfile
-- Description: Rejects vendor profile (admin only)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_RejectProfile]'))
    DROP PROCEDURE [vendors].[sp_RejectProfile];
GO

CREATE PROCEDURE [vendors].[sp_RejectProfile]
    @VendorProfileID INT,
    @RejectionReason NVARCHAR(MAX),
    @AdminNotes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET ProfileStatus = 'rejected', 
        RejectionReason = @RejectionReason,
        AdminNotes = @AdminNotes,
        ReviewedAt = GETDATE(),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

