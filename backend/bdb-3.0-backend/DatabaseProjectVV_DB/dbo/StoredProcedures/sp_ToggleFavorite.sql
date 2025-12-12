
-- Create stored procedure for toggling favorites
CREATE   PROCEDURE sp_ToggleFavorite
    @UserID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if favorite exists
    IF EXISTS (SELECT 1 FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID)
    BEGIN
        -- Remove favorite
        DELETE FROM Favorites WHERE UserID = @UserID AND VendorProfileID = @VendorProfileID;
        SELECT 'removed' as Status, 0 as IsFavorite;
    END
    ELSE
    BEGIN
        -- Add favorite
        INSERT INTO Favorites (UserID, VendorProfileID, CreatedAt)
        VALUES (@UserID, @VendorProfileID, GETDATE());
        SELECT 'added' as Status, 1 as IsFavorite;
    END
END

GO

