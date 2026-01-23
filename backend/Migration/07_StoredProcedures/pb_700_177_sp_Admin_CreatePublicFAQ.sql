-- =============================================
-- Stored Procedure: admin.sp_CreatePublicFAQ
-- Description: Creates a new public FAQ
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_CreatePublicFAQ]'))
    DROP PROCEDURE [admin].[sp_CreatePublicFAQ];
GO

CREATE PROCEDURE [admin].[sp_CreatePublicFAQ]
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @Category NVARCHAR(100) = 'General',
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO admin.FAQs (Question, Answer, Category, DisplayOrder, IsActive)
    OUTPUT INSERTED.*
    VALUES (@Question, @Answer, @Category, @DisplayOrder, 1);
END
GO
