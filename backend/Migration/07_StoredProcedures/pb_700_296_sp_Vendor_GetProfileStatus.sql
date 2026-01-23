-- =============================================
-- Stored Procedure: vendors.sp_GetProfileStatus
-- Description: Gets vendor profile status
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetProfileStatus]'))
    DROP PROCEDURE [vendors].[sp_GetProfileStatus];
GO

CREATE PROCEDURE [vendors].[sp_GetProfileStatus]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ProfileStatus,
        SubmittedForReviewAt,
        ReviewedAt,
        RejectionReason,
        AdminNotes,
        IsVerified,
        AcceptingBookings
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO

