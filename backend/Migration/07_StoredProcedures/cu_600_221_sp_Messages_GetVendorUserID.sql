-- =============================================
-- Stored Procedure: messages.sp_GetVendorUserID
-- Description: Gets UserID for a vendor profile
-- Phase: 600 (Stored Procedures)
-- Schema: messages
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[messages].[sp_GetVendorUserID]'))
    DROP PROCEDURE [messages].[sp_GetVendorUserID];
GO

CREATE PROCEDURE [messages].[sp_GetVendorUserID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO

