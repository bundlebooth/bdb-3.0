/*
    Migration Script: Create Stored Procedure [sp_RegisterVendor]
    Phase: 600 - Stored Procedures
    Script: cu_600_085_dbo.sp_RegisterVendor.sql
    Description: Creates the [dbo].[sp_RegisterVendor] stored procedure
    
    Execution Order: 85
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_RegisterVendor]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_RegisterVendor]'))
    DROP PROCEDURE [dbo].[sp_RegisterVendor];
GO

CREATE   PROCEDURE [dbo].[sp_RegisterVendor]
    @UserID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255),
    @YearsInBusiness INT = NULL,
    @Address NVARCHAR(255),
    @City NVARCHAR(100),
    @State NVARCHAR(50),
    @Country NVARCHAR(50) = 'USA',
    @PostalCode NVARCHAR(20),
    @Categories NVARCHAR(MAX) = NULL,
    @Services NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Update user to be a vendor
        UPDATE Users SET IsVendor = 1, UpdatedAt = GETDATE() WHERE UserID = @UserID;

        DECLARE @VendorProfileID INT;
        -- Check if a vendor profile already exists for the user
        SELECT @VendorProfileID = VendorProfileID FROM VendorProfiles WHERE UserID = @UserID;

        IF @VendorProfileID IS NULL
        BEGIN
            -- Create new vendor profile
            INSERT INTO VendorProfiles (
                UserID,
                BusinessName,
                DisplayName,
                BusinessDescription,
                BusinessPhone,
                Website,
                YearsInBusiness,
                Address,
                City,
                State,
                Country,
                PostalCode,
                IsVerified,
                IsCompleted
            )
            VALUES (
                @UserID,
                @BusinessName,
                @DisplayName,
                @BusinessDescription,
                @BusinessPhone,
                @Website,
                @YearsInBusiness,
                @Address,
                @City,
                @State,
                @Country,
                @PostalCode,
                0, -- Not verified on signup
                0  -- Not completed yet (multi-step process)
            );
            
            SET @VendorProfileID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            -- Update existing vendor profile
             UPDATE VendorProfiles
             SET
                BusinessName = @BusinessName,
                DisplayName = @DisplayName,
                BusinessDescription = @BusinessDescription,
                BusinessPhone = @BusinessPhone,
                Website = @Website,
                YearsInBusiness = @YearsInBusiness,
                Address = @Address,
                City = @City,
                State = @State,
                Country = @Country,
                PostalCode = @PostalCode,
                UpdatedAt = GETDATE()
             WHERE VendorProfileID = @VendorProfileID;
        END

        -- Remove existing categories and add new ones if provided
        DELETE FROM VendorCategories WHERE VendorProfileID = @VendorProfileID;
        IF @Categories IS NOT NULL
        BEGIN
            INSERT INTO VendorCategories (VendorProfileID, Category)
            SELECT @VendorProfileID, value
            FROM OPENJSON(@Categories);
        END
        
        -- Add services if provided
        -- This logic is now a separate step in the multi-step form, so we'll leave it simplified here.
        -- For a real application, you'd have a separate SP to handle services.
        
        COMMIT TRANSACTION;
        
        SELECT 
            1 AS Success,
            @UserID AS UserID,
            @VendorProfileID AS VendorProfileID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_RegisterVendor] created successfully.';
GO
