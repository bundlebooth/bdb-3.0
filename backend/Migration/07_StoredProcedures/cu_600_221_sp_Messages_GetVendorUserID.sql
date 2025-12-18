-- =============================================
-- Stored Procedure: sp_Messages_GetVendorUserID
-- Description: Gets UserID for a vendor profile
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Messages_GetVendorUserID]'))
    DROP PROCEDURE [dbo].[sp_Messages_GetVendorUserID];
GO

CREATE PROCEDURE [dbo].[sp_Messages_GetVendorUserID]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID;
END
GO
