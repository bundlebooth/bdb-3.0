-- =============================================
-- Stored Procedure: sp_GetVendorProfileByUserID
-- Description: Gets vendor profile ID by user ID
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorProfileByUserID]'))
    DROP PROCEDURE [dbo].[sp_GetVendorProfileByUserID];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorProfileByUserID]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;
END
GO
