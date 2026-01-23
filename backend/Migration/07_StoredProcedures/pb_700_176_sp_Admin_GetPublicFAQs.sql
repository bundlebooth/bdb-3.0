-- =============================================
-- Stored Procedure: admin.sp_GetPublicFAQs
-- Description: Gets FAQs for public display (Help Centre)
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetPublicFAQs]'))
    DROP PROCEDURE [admin].[sp_GetPublicFAQs];
GO

CREATE PROCEDURE [admin].[sp_GetPublicFAQs]
    @Category NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.FAQID,
        f.Question,
        f.Answer,
        f.Category,
        f.DisplayOrder,
        f.IsActive,
        f.CreatedAt,
        f.UpdatedAt
    FROM [admin].[FAQs] f
    WHERE f.IsActive = 1
        AND (@Category IS NULL OR f.Category = @Category)
    ORDER BY f.Category, f.DisplayOrder, f.FAQID;
END
GO
