-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetCategoryAnswers
-- Description: Gets vendor category answers
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetCategoryAnswers]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetCategoryAnswers];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetCategoryAnswers]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT AnswerID, QuestionID, Answer, CreatedAt, UpdatedAt
    FROM VendorCategoryAnswers
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY AnswerID;
END
GO
