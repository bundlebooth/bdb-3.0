/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorProfileLocation]
    Phase: 600 - Stored Procedures
    Script: cu_600_108_dbo.sp_UpdateVendorProfileLocation.sql
    Description: Creates the [vendors].[sp_UpdateProfileLocation] stored procedure
    
    Execution Order: 108
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdateProfileLocation]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfileLocation]'))
    DROP PROCEDURE [vendors].[sp_UpdateProfileLocation];
GO

CREATE   PROCEDURE [vendors].[sp_UpdateProfileLocation]
    @VendorProfileID INT,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50),
    @PostalCode NVARCHAR(20),
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        Latitude = @Latitude,
        Longitude = @Longitude,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpdateProfileLocation] created successfully.';
GO

