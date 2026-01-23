/*
    Migration Script: Create FAQFeedback Table
    Phase: 200 - Tables
    Script: cu_200_95_FAQFeedback.sql
    Description: Creates the FAQFeedback table for storing user feedback on FAQs
    Execution Order: 95
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table FAQFeedback...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.tables WHERE name = 'FAQFeedback')
BEGIN
    CREATE TABLE FAQFeedback (
        FeedbackID INT IDENTITY(1,1) PRIMARY KEY,
        FAQID INT NOT NULL,
        UserID INT NULL,
        Rating NVARCHAR(20) NOT NULL,
        CreatedAt DATETIME DEFAULT GETDATE()
    );
    
    CREATE INDEX IX_FAQFeedback_FAQID ON FAQFeedback(FAQID);
    CREATE INDEX IX_FAQFeedback_UserID ON FAQFeedback(UserID);
    
    PRINT 'Table FAQFeedback created successfully.';
END
ELSE
BEGIN
    PRINT 'Table FAQFeedback already exists.';
END
GO
