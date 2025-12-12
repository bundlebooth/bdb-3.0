
-- Delete portfolio image
CREATE   PROCEDURE sp_DeletePortfolioImage
    @PortfolioImageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (
        SELECT 1 FROM VendorPortfolioImages 
        WHERE PortfolioImageID = @PortfolioImageID AND VendorProfileID = @VendorProfileID
    )
    BEGIN
        DELETE FROM VendorPortfolioImages WHERE PortfolioImageID = @PortfolioImageID;
        SELECT 1 AS Success;
    END
    ELSE
    BEGIN
        RAISERROR('Image not found or access denied.', 16, 1);
        SELECT 0 AS Success;
    END
END;

GO

