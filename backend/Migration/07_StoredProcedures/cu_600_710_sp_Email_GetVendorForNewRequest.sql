/*
    Migration Script: Create Stored Procedure [email.sp_GetVendorForNewRequest]
    Phase: 600 - Stored Procedures
    Description: Gets vendor and client details for new booking request email notification
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [email].[sp_GetVendorForNewRequest]...';
GO

-- Create schema if not exists
IF NOT EXISTS (SELECT 1 FROM sys.schemas WHERE name = 'email')
    EXEC('CREATE SCHEMA email');
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
        vu.Name AS VendorName,
        vu.Email AS VendorEmail,
        u.Name AS ClientName,
        u.Email AS ClientEmail
    FROM vendors.VendorProfiles vp
    INNER JOIN users.Users vu ON vp.UserID = vu.UserID
    INNER JOIN users.Users u ON u.UserID = @UserID
    WHERE vp.VendorProfileID = @VendorProfileID;
END
GO

PRINT 'Stored procedure [email].[sp_GetVendorForNewRequest] created successfully.';
GO
