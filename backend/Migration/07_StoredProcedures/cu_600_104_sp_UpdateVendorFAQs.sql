/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorFAQs]
    Phase: 600 - Stored Procedures
    Script: cu_600_104_dbo.sp_UpdateVendorFAQs.sql
    Description: Creates the [dbo].[sp_UpdateVendorFAQs] stored procedure
    
    Execution Order: 104
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorFAQs]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorFAQs]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorFAQs];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorFAQs]
    @VendorProfileID INT,
    @FAQs NVARCHAR(MAX) -- JSON array of FAQs
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        BEGIN TRANSACTION;
        
        -- Clear existing FAQs for this vendor
        DELETE FROM VendorFAQs WHERE VendorProfileID = @VendorProfileID;
        
        -- Insert new FAQs from JSON
        INSERT INTO VendorFAQs (
            VendorProfileID, 
            Question, 
            Answer, 
            AnswerType, 
            AnswerOptions, 
            DisplayOrder,
            IsActive
        )
        SELECT 
            @VendorProfileID,
            JSON_VALUE(value, '$.question'),
            JSON_VALUE(value, '$.answer'),
            ISNULL(JSON_VALUE(value, '$.answerType'), 'text'),
            JSON_QUERY(value, '$.answerOptions'),
            ISNULL(TRY_CAST(JSON_VALUE(value, '$.displayOrder') AS INT), ROW_NUMBER() OVER (ORDER BY (SELECT NULL))),
            1
        FROM OPENJSON(@FAQs);
        
        -- Mark step 8 as completed
        UPDATE VendorProfiles 
        SET SetupStep8Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        COMMIT TRANSACTION;
        SELECT 1 AS Success, 'FAQs updated successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [dbo].[sp_UpdateVendorFAQs] created successfully.';
GO
