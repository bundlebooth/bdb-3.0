/*
    Migration Script: Create Stored Procedure [sp_SaveVendorAdditionalDetails]
    Phase: 600 - Stored Procedures
    Script: cu_600_087_dbo.sp_SaveVendorAdditionalDetails.sql
    Description: Creates the [dbo].[sp_SaveVendorAdditionalDetails] stored procedure
    
    Execution Order: 87
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_SaveVendorAdditionalDetails]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_SaveVendorAdditionalDetails]'))
    DROP PROCEDURE [dbo].[sp_SaveVendorAdditionalDetails];
GO

CREATE   PROCEDURE [dbo].[sp_SaveVendorAdditionalDetails]
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

PRINT 'Stored procedure [dbo].[sp_SaveVendorAdditionalDetails] created successfully.';
GO
