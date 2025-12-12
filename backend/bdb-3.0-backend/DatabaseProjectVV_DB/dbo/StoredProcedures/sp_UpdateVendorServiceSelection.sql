
-- Stored procedure to add/update vendor service selection
CREATE   PROCEDURE sp_UpdateVendorServiceSelection
    @VendorProfileID INT,
    @PredefinedServiceID INT,
    @VendorPrice DECIMAL(10, 2),
    @VendorDurationMinutes INT = NULL,
    @VendorDescription NVARCHAR(MAX) = NULL,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Check if selection already exists
        IF EXISTS (SELECT 1 FROM VendorSelectedServices 
                   WHERE VendorProfileID = @VendorProfileID 
                   AND PredefinedServiceID = @PredefinedServiceID)
        BEGIN
            -- Update existing selection
            UPDATE VendorSelectedServices
            SET VendorPrice = @VendorPrice,
                VendorDurationMinutes = @VendorDurationMinutes,
                VendorDescription = @VendorDescription,
                IsActive = @IsActive,
                UpdatedAt = GETDATE()
            WHERE VendorProfileID = @VendorProfileID 
                AND PredefinedServiceID = @PredefinedServiceID;
        END
        ELSE
        BEGIN
            -- Insert new selection
            INSERT INTO VendorSelectedServices (
                VendorProfileID, 
                PredefinedServiceID, 
                VendorPrice, 
                VendorDurationMinutes, 
                VendorDescription, 
                IsActive
            )
            VALUES (
                @VendorProfileID, 
                @PredefinedServiceID, 
                @VendorPrice, 
                @VendorDurationMinutes, 
                @VendorDescription, 
                @IsActive
            );
        END
        
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS ErrorMessage;
    END CATCH
END

GO

