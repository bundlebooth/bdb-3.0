-- =============================================
-- Stored Procedure: sp_Admin_UpdatePublicFAQ
-- Description: Updates a public FAQ
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_UpdatePublicFAQ]'))
    DROP PROCEDURE [dbo].[sp_Admin_UpdatePublicFAQ];
GO

CREATE PROCEDURE [dbo].[sp_Admin_UpdatePublicFAQ]
    @FAQID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @DisplayOrder INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE FAQs 
    SET Question = @Question, Answer = @Answer, Category = @Category, 
        DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
    WHERE FAQID = @FAQID;
    
    SELECT * FROM FAQs WHERE FAQID = @FAQID;
END
GO
