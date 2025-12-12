
-- Save vendor additional details (category-specific answers)
CREATE   PROCEDURE sp_SaveVendorAdditionalDetails
    @VendorProfileID INT,
    @AdditionalDetailsJSON NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Delete existing additional details for this vendor
        DELETE FROM VendorAdditionalDetails WHERE VendorProfileID = @VendorProfileID;
        
        -- Parse JSON and insert new details
        INSERT INTO VendorAdditionalDetails (VendorProfileID, QuestionID, Answer)
        SELECT 
            @VendorProfileID,
            JSON_VALUE(value, '$.questionId'),
            JSON_VALUE(value, '$.answer')
        FROM OPENJSON(@AdditionalDetailsJSON);
        
        -- Update setup step completion
        UPDATE VendorProfiles 
        SET SetupStep4Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'Additional details saved successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

