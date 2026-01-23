/*
    Migration Script: Create Stored Procedure [email].[sp_GetVendorForNewRequest]
    Description: Creates the [email].[sp_GetVendorForNewRequest] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[email].[sp_GetVendorForNewRequest]'))
    DROP PROCEDURE [email].[sp_GetVendorForNewRequest];
GO


CREATE PROCEDURE [email].[sp_GetVendorForNewRequest]
    @VendorProfileID INT,
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vp.BusinessName AS VendorBusinessName,
        vu.UserID AS VendorUserID,
        COALESCE(vu.FirstName + ' ' + COALESCE(vu.LastName, ''), vu.FirstName, 'Vendor') AS VendorName,
        vu.Email AS VendorEmail,
        COALESCE(u.FirstName + ' ' + COALESCE(u.LastName, ''), u.FirstName, 'Client') AS ClientName,
        u.Email AS ClientEmail
    FROM vendors.VendorProfiles vp
    INNER JOIN users.Users vu ON vp.UserID = vu.UserID
    INNER JOIN users.Users u ON u.UserID = @UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO
