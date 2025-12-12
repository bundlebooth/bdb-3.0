
-- Create or update user location
CREATE   PROCEDURE sp_UpdateUserLocation
    @UserID INT,
    @Latitude DECIMAL(10, 8),
    @Longitude DECIMAL(11, 8),
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO UserLocations (
        UserID,
        Latitude,
        Longitude,
        City,
        State,
        Country
    )
    VALUES (
        @UserID,
        @Latitude,
        @Longitude,
        @City,
        @State,
        @Country
    );
    
    SELECT SCOPE_IDENTITY() AS LocationID;
END;

GO

