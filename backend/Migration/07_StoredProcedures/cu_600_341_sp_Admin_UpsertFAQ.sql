-- =============================================
-- Stored Procedure: sp_Admin_UpsertFAQ
-- Description: Creates or updates a platform FAQ
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpsertFAQ]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpsertFAQ];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpsertFAQ]
    @FAQID INT = NULL,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @Category NVARCHAR(100) = 'general',
    @DisplayOrder INT = 0,
    @IsActive BIT = 1
AS
BEGIN
    SET NOCOUNT ON;
    
    IF @FAQID IS NOT NULL
    BEGIN
        UPDATE PlatformFAQs SET 
            Question = @Question, 
            Answer = @Answer, 
            Category = @Category, 
            DisplayOrder = @DisplayOrder, 
            IsActive = @IsActive, 
            UpdatedAt = GETUTCDATE()
        WHERE FAQID = @FAQID;
        
        SELECT @FAQID AS FAQID;
    END
    ELSE
    BEGIN
        INSERT INTO PlatformFAQs (Question, Answer, Category, DisplayOrder, IsActive)
        OUTPUT INSERTED.FAQID
        VALUES (@Question, @Answer, @Category, @DisplayOrder, @IsActive);
    END
END
GO
