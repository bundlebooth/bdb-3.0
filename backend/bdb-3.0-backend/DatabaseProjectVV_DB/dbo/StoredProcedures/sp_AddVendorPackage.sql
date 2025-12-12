
-- Add vendor package with enhanced features
CREATE   PROCEDURE sp_AddVendorPackage
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
    FROM ServiceCategories 
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
    UPDATE VendorProfiles SET PackagesCompleted = 1, SetupStep = CASE WHEN SetupStep < 2 THEN 2 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT SCOPE_IDENTITY() AS ServiceID, 'Package added successfully' AS Message;
END;

GO

