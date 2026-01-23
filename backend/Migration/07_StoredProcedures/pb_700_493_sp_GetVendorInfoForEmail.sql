/*
    Migration Script: Create Stored Procedure [admin].[sp_GetVendorInfoForEmail]
    Description: Creates the [admin].[sp_GetVendorInfoForEmail] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorInfoForEmail]'))
    DROP PROCEDURE [admin].[sp_GetVendorInfoForEmail];
GO


CREATE PROCEDURE admin.sp_GetVendorInfoForEmail
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT vp.VendorProfileID, vp.BusinessName, u.UserID, u.Email, u.Name
    FROM vendors.VendorProfiles vp
    INNER JOIN users.Users u ON vp.UserID = u.UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO
