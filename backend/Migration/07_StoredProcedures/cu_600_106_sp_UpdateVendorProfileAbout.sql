/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorProfileAbout]
    Phase: 600 - Stored Procedures
    Script: cu_600_106_dbo.sp_UpdateVendorProfileAbout.sql
    Description: Creates the [dbo].[sp_UpdateVendorProfileAbout] stored procedure
    
    Execution Order: 106
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorProfileAbout]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorProfileAbout]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorProfileAbout];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorProfileAbout]
    @VendorProfileID INT,
    @Tagline NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @YearsInBusiness INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE VendorProfiles
    SET Tagline = @Tagline,
        BusinessDescription = @BusinessDescription,
        YearsInBusiness = @YearsInBusiness,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateVendorProfileAbout] created successfully.';
GO
