/*
    Migration Script: Create Stored Procedure [admin].[sp_ReactivateVendor]
    Description: Creates the [admin].[sp_ReactivateVendor] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_ReactivateVendor]'))
    DROP PROCEDURE [admin].[sp_ReactivateVendor];
GO


CREATE PROCEDURE admin.sp_ReactivateVendor
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE vendors.VendorProfiles 
    SET IsVisible = 1, ProfileStatus = 'approved'
    WHERE VendorProfileID = @VendorProfileID;
END
GO
