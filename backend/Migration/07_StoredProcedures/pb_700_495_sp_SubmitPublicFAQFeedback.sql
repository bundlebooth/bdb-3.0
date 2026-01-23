/*
    Migration Script: Create Stored Procedure [admin].[sp_SubmitPublicFAQFeedback]
    Description: Creates the [admin].[sp_SubmitPublicFAQFeedback] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_SubmitPublicFAQFeedback]'))
    DROP PROCEDURE [admin].[sp_SubmitPublicFAQFeedback];
GO


CREATE PROCEDURE [admin].[sp_SubmitPublicFAQFeedback]
    @FAQID INT,
    @UserID INT = NULL,
    @Rating NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Table should already exist from migrations, but check just in case
    IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FAQFeedback')
    BEGIN
        INSERT INTO FAQFeedback (FAQID, UserID, Rating, CreatedAt)
        VALUES (@FAQID, @UserID, @Rating, GETDATE());
    END
END
GO
