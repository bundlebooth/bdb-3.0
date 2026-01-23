-- =============================================
-- Stored Procedure: vendors.sp_CheckProfileExists
-- Description: Checks if vendor profile exists for a user
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_CheckProfileExists]'))
    DROP PROCEDURE [vendors].[sp_CheckProfileExists];
GO

CREATE PROCEDURE [vendors].[sp_CheckProfileExists]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID;
END
GO

