/*
    Migration Script: Create Stored Procedure [vendors].[sp_Vendor_SaveCategoryAnswers]
    Phase: 700 - Stored Procedures
    Description: Upserts vendor category question answers
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_Vendor_SaveCategoryAnswers]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Vendor_SaveCategoryAnswers]'))
    DROP PROCEDURE [vendors].[sp_Vendor_SaveCategoryAnswers];
GO

CREATE PROCEDURE [vendors].[sp_Vendor_SaveCategoryAnswers]
    @VendorProfileID INT,
    @QuestionID INT,
    @Answer NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    MERGE [vendors].[VendorCategoryAnswers] AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @QuestionID AS QuestionID) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.QuestionID = source.QuestionID
    WHEN MATCHED THEN
        UPDATE SET Answer = @Answer, UpdatedAt = GETUTCDATE()
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, QuestionID, Answer, CreatedAt, UpdatedAt)
        VALUES (@VendorProfileID, @QuestionID, @Answer, GETUTCDATE(), GETUTCDATE());
END;
GO

PRINT 'Stored procedure [vendors].[sp_Vendor_SaveCategoryAnswers] created successfully.';
GO
