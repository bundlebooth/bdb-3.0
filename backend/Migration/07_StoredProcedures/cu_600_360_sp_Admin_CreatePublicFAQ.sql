-- =============================================
-- Stored Procedure: sp_Admin_CreatePublicFAQ
-- Description: Creates a new public FAQ
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_CreatePublicFAQ]'))
    DROP PROCEDURE [dbo].[sp_Admin_CreatePublicFAQ];
GO

CREATE PROCEDURE [dbo].[sp_Admin_CreatePublicFAQ]
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @Category NVARCHAR(100) = 'General',
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO FAQs (Question, Answer, Category, DisplayOrder, IsActive)
    OUTPUT INSERTED.*
    VALUES (@Question, @Answer, @Category, @DisplayOrder, 1);
END
GO
