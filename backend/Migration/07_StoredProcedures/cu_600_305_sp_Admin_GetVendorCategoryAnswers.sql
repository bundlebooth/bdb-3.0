-- =============================================
-- Stored Procedure: admin.sp_GetVendorCategoryAnswers
-- Description: Gets vendor category questionnaire answers
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorCategoryAnswers]'))
    DROP PROCEDURE [admin].[sp_GetVendorCategoryAnswers];
GO

CREATE PROCEDURE [admin].[sp_GetVendorCategoryAnswers]
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
