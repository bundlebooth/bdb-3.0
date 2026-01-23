/*
    Migration Script: Create Stored Procedure [vendors].[sp_Register]
    Description: Registers a vendor profile with default values to prevent NULLs
    
    Execution Order: 722
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Register]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Register]'))
    DROP PROCEDURE [vendors].[sp_Register];
GO

CREATE PROCEDURE [vendors].[sp_Register]
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

        UPDATE users.Users SET IsVendor = 1, UpdatedAt = GETDATE() WHERE UserID = @UserID;

        DECLARE @VendorProfileID INT;
        SELECT @VendorProfileID = VendorProfileID FROM vendors.VendorProfiles WHERE UserID = @UserID;

        IF @VendorProfileID IS NULL
        BEGIN
            -- Insert with COALESCE to prevent NULLs
            INSERT INTO vendors.VendorProfiles (
                UserID, BusinessName, DisplayName, BusinessDescription, 
                BusinessPhone, BusinessEmail, Website, LogoURL, StripeAccountID, 
                YearsInBusiness, Address, City, State, Country, PostalCode,
                IsVerified, IsCompleted, AvgRating, TotalBookings, TotalReviews, 
                CreatedAt, UpdatedAt
            )
            VALUES (
                @UserID, 
                @BusinessName, 
                @DisplayName, 
                COALESCE(@BusinessDescription, ''),
                COALESCE(@BusinessPhone, ''), 
                '',  -- BusinessEmail default
                COALESCE(@Website, ''), 
                '',  -- LogoURL default
                '',  -- StripeAccountID default
                @YearsInBusiness,
                COALESCE(@Address, ''), 
                COALESCE(@City, ''), 
                COALESCE(@State, ''), 
                @Country, 
                COALESCE(@PostalCode, ''),
                0,   -- IsVerified
                0,   -- IsCompleted
                0,   -- AvgRating
                0,   -- TotalBookings
                0,   -- TotalReviews
                GETDATE(), 
                GETDATE()
            );
            SET @VendorProfileID = SCOPE_IDENTITY();
        END
        ELSE
        BEGIN
            UPDATE vendors.VendorProfiles
            SET BusinessName = @BusinessName, 
                DisplayName = @DisplayName,
                BusinessDescription = COALESCE(@BusinessDescription, BusinessDescription),
                BusinessPhone = COALESCE(@BusinessPhone, BusinessPhone),
                Website = COALESCE(@Website, Website), 
                YearsInBusiness = @YearsInBusiness,
                Address = COALESCE(@Address, Address), 
                City = COALESCE(@City, City),
                State = COALESCE(@State, State), 
                Country = @Country,
                PostalCode = COALESCE(@PostalCode, PostalCode), 
                UpdatedAt = GETDATE()
            WHERE VendorProfileID = @VendorProfileID;
        END

        DELETE FROM vendors.VendorCategories WHERE VendorProfileID = @VendorProfileID;
        IF @Categories IS NOT NULL
        BEGIN
            INSERT INTO vendors.VendorCategories (VendorProfileID, Category)
            SELECT @VendorProfileID, value FROM OPENJSON(@Categories);
        END

        COMMIT TRANSACTION;
        SELECT 1 AS Success, @UserID AS UserID, @VendorProfileID AS VendorProfileID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Stored procedure [vendors].[sp_Register] created successfully.';
GO
