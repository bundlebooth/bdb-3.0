-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertFAQ
-- Description: Inserts a FAQ
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertFAQ]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertFAQ];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertFAQ]
    @VendorProfileID INT,
    @Question NVARCHAR(500),
    @Answer NVARCHAR(MAX),
    @AnswerType NVARCHAR(50),
    @AnswerOptions NVARCHAR(MAX),
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorFAQs (VendorProfileID, Question, Answer, AnswerType, AnswerOptions, DisplayOrder, IsActive, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @Question, @Answer, @AnswerType, @AnswerOptions, @DisplayOrder, 1, GETDATE(), GETDATE());
    
    SELECT SCOPE_IDENTITY() AS FAQID;
END
GO
