/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorProfileAbout]
    Phase: 600 - Stored Procedures
    Script: cu_600_106_dbo.sp_UpdateVendorProfileAbout.sql
    Description: Creates the [vendors].[sp_UpdateProfileAbout] stored procedure
    
    Execution Order: 106
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdateProfileAbout]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfileAbout]'))
    DROP PROCEDURE [vendors].[sp_UpdateProfileAbout];
GO

CREATE   PROCEDURE [vendors].[sp_UpdateProfileAbout]
    @VendorProfileID INT,
    @Tagline NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @YearsInBusiness INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE vendors.VendorProfiles
    SET Tagline = @Tagline,
        BusinessDescription = @BusinessDescription,
        YearsInBusiness = @YearsInBusiness,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpdateProfileAbout] created successfully.';
GO

