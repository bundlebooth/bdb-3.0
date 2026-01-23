/*
    Migration Script: Create Stored Procedure [sp_AddVendorPackage]
    Phase: 600 - Stored Procedures
    Script: cu_600_007_dbo.sp_AddVendorPackage.sql
    Description: Creates the [vendors].[sp_AddPackage] stored procedure
    
    Execution Order: 7
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_AddPackage]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_AddPackage]'))
    DROP PROCEDURE [vendors].[sp_AddPackage];
GO

CREATE   PROCEDURE [vendors].[sp_AddPackage]
    @VendorProfileID INT,
    @PackageName NVARCHAR(255),
    @Description NVARCHAR(MAX),
    @Price DECIMAL(10,2),
    @Duration NVARCHAR(50),
    @MaxGuests INT,
    @Includes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get or create "Packages" category
    DECLARE @CategoryID INT;
    SELECT @CategoryID = CategoryID 
    FROM vendors.ServiceCategories 
    WHERE VendorProfileID = @VendorProfileID AND Name = 'Packages';
    
    IF @CategoryID IS NULL
    BEGIN
        INSERT INTO ServiceCategories (VendorProfileID, Name, Description)
        VALUES (@VendorProfileID, 'Packages', 'Service packages offered');
        SET @CategoryID = SCOPE_IDENTITY();
    END
    
    -- Convert duration to minutes
    DECLARE @DurationMinutes INT = 60; -- Default 1 hour
    IF @Duration LIKE '%hour%'
        SET @DurationMinutes = CAST(SUBSTRING(@Duration, 1, CHARINDEX(' ', @Duration) - 1) AS INT) * 60;
    
    INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, MaxAttendees, ServiceType)
    VALUES (@CategoryID, @PackageName, @Description, @Price, @DurationMinutes, @MaxGuests, 'Package');
    
    -- Update progress
    UPDATE vendors.VendorProfiles SET PackagesCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ServiceID, 'Package added successfully' AS Message;
END;

GO

PRINT 'Stored procedure [vendors].[sp_AddPackage] created successfully.';
GO

