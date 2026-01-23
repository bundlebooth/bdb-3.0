-- =============================================
-- Stored Procedure: vendors.sp_GetUserID
-- Description: Gets the UserID for a vendor profile
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetUserID]'))
    DROP PROCEDURE [vendors].[sp_GetUserID];
GO

CREATE PROCEDURE [vendors].[sp_GetUserID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

