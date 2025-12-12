
-- ============================================
-- CATEGORY QUESTIONS STORED PROCEDURES
-- ============================================

-- Get category-specific questions
CREATE   PROCEDURE sp_GetCategoryQuestions
    @Category NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        QuestionID,
        Category,
        QuestionText,
        QuestionType,
        Options,
        IsRequired,
        DisplayOrder
    FROM CategoryQuestions 
    WHERE Category = @Category AND IsActive = 1
    ORDER BY DisplayOrder ASC;
END;

GO

