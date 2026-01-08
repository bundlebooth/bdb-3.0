-- =============================================
-- Stored Procedure: admin.sp_UpdatePublicFAQ
-- Description: Updates a public FAQ
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_UpdatePublicFAQ]'))
    DROP PROCEDURE [admin].[sp_UpdatePublicFAQ];
GO

CREATE PROCEDURE [admin].[sp_UpdatePublicFAQ]
    @FAQID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @Category NVARCHAR(100),
    @DisplayOrder INT,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE admin.FAQs 
    SET Question = @Question, Answer = @Answer, Category = @Category, 
        DisplayOrder = @DisplayOrder, IsActive = @IsActive, UpdatedAt = GETUTCDATE()
    WHERE FAQID = @FAQID;
    
    SELECT * FROM admin.FAQs WHERE FAQID = @FAQID;
END
GO
