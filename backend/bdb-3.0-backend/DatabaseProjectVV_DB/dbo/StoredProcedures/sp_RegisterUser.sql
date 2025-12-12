
-- Recreate the procedure with proper settings
CREATE PROCEDURE sp_RegisterUser
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

