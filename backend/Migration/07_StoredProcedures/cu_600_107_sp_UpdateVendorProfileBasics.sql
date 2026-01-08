/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorProfileBasics]
    Phase: 600 - Stored Procedures
    Script: cu_600_107_dbo.sp_UpdateVendorProfileBasics.sql
    Description: Creates the [vendors].[sp_UpdateProfileBasics] stored procedure
    
    Execution Order: 107
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdateProfileBasics]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfileBasics]'))
    DROP PROCEDURE [vendors].[sp_UpdateProfileBasics];
GO

CREATE   PROCEDURE [vendors].[sp_UpdateProfileBasics]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessEmail NVARCHAR(100),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255),
    @Categories NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE vendors.VendorProfiles
    SET BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessEmail = @BusinessEmail,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update User's main email if needed
    UPDATE users.Users SET Email = @BusinessEmail WHERE UserID = (SELECT UserID FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID);

    -- Update Categories
    DELETE FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID;
    IF @Categories IS NOT NULL
    BEGIN
        INSERT INTO vendors.VendorCategories (VendorProfileID, Category)
        SELECT @VendorProfileID, value
        FROM OPENJSON(@Categories);
    END
    
    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpdateProfileBasics] created successfully.';
GO



