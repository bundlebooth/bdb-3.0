
-- NEW: Update Vendor Profile from Step 1 (Business Basics)
CREATE   PROCEDURE sp_UpdateVendorProfileBasics
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

