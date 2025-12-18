-- =============================================
-- Stored Procedure: sp_Admin_GetVendorCategoryAnswers
-- Description: Gets vendor category questionnaire answers
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorCategoryAnswers]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorCategoryAnswers];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        ca.AnswerID, 
        ca.QuestionID, 
        cq.QuestionText, 
        cq.Category, 
        ca.Answer
    FROM VendorCategoryAnswers ca
    JOIN CategoryQuestions cq ON ca.QuestionID = cq.QuestionID
    WHERE ca.VendorProfileID = @VendorProfileID
    ORDER BY ca.AnswerID;
END
GO
