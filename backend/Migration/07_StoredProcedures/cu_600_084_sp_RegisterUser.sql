/*
    Migration Script: Create Stored Procedure [sp_RegisterUser]
    Phase: 600 - Stored Procedures
    Script: cu_600_084_dbo.sp_RegisterUser.sql
    Description: Creates the [dbo].[sp_RegisterUser] stored procedure
    
    Execution Order: 84
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_RegisterUser]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_RegisterUser]'))
    DROP PROCEDURE [dbo].[sp_RegisterUser];
GO

CREATE PROCEDURE [dbo].[sp_RegisterUser]
    @Name NVARCHAR(100),
    @Email NVARCHAR(100),
    @PasswordHash NVARCHAR(255),
    @IsVendor BIT = 0,
    @AuthProvider NVARCHAR(20) = 'email'
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Insert user
        INSERT INTO Users (Name, Email, PasswordHash, IsVendor, AuthProvider)
        VALUES (@Name, @Email, @PasswordHash, @IsVendor, @AuthProvider);
        
        DECLARE @UserID INT = SCOPE_IDENTITY();
        
        -- If vendor, create vendor profile
        IF @IsVendor = 1
        BEGIN
            INSERT INTO VendorProfiles (UserID, BusinessName)
            VALUES (@UserID, @Name);
        END
        
        COMMIT TRANSACTION;
        
        SELECT @UserID AS UserID;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

PRINT 'Stored procedure [dbo].[sp_RegisterUser] created successfully.';
GO
