
-- NEW: Update Vendor Profile from Step 3 (About)
CREATE   PROCEDURE sp_UpdateVendorProfileAbout
    @VendorProfileID INT,
    @Tagline NVARCHAR(255),
    @BusinessDescription NVARCHAR(MAX),
    @YearsInBusiness INT = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE VendorProfiles
    SET Tagline = @Tagline,
        BusinessDescription = @BusinessDescription,
        YearsInBusiness = @YearsInBusiness,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;

    SELECT 1 AS Success;
END;

GO

