/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorProfileBasics]
    Phase: 600 - Stored Procedures
    Script: cu_600_107_dbo.sp_UpdateVendorProfileBasics.sql
    Description: Creates the [dbo].[sp_UpdateVendorProfileBasics] stored procedure
    
    Execution Order: 107
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorProfileBasics]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorProfileBasics]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorProfileBasics];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorProfileBasics]
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

    UPDATE VendorProfiles
    SET BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessEmail = @BusinessEmail,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Update User's main email if needed
    UPDATE Users SET Email = @BusinessEmail WHERE UserID = (SELECT UserID FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID);

    -- Update Categories
    DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;
    IF @Categories IS NOT NULL
    BEGIN
        INSERT INTO VendorCategories (VendorProfileID, Category)
        SELECT @VendorProfileID, value
        FROM OPENJSON(@Categories);
    END
    
    SELECT 1 AS Success;
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateVendorProfileBasics] created successfully.';
GO
