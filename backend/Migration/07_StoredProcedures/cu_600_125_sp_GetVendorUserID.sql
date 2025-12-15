-- =============================================
-- Stored Procedure: sp_GetVendorUserID
-- Description: Gets the UserID for a vendor profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorUserID]'))
    DROP PROCEDURE [dbo].[sp_GetVendorUserID];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorUserID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
