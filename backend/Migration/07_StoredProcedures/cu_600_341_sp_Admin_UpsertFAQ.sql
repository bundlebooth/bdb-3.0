-- =============================================
-- Stored Procedure: admin.sp_UpsertFAQ
-- Description: Creates or updates a platform FAQ
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpsertFAQ]'))
    DROP PROCEDURE [admin].[sp_UpsertFAQ];
GO

CREATE PROCEDURE [admin].[sp_UpsertFAQ]
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
