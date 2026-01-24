-- =============================================
-- Table: users.UserReports
-- Description: Stores user profile reports
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserReports]') AND type = 'U')
BEGIN
    CREATE TABLE [users].[UserReports] (
        [ReportID] INT IDENTITY(1,1) PRIMARY KEY,
        [ReportedUserID] INT NOT NULL,
        [ReportedBy] INT NULL,
        [Reason] NVARCHAR(100) NOT NULL,
        [Details] NVARCHAR(MAX) NULL,
        [Status] NVARCHAR(50) NOT NULL DEFAULT 'pending',
        [ReviewedBy] INT NULL,
        [ReviewedAt] DATETIME NULL,
        [ReviewNotes] NVARCHAR(MAX) NULL,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        CONSTRAINT [FK_UserReports_ReportedUser] FOREIGN KEY ([ReportedUserID]) REFERENCES [users].[Users]([UserID]),
        CONSTRAINT [FK_UserReports_ReportedBy] FOREIGN KEY ([ReportedBy]) REFERENCES [users].[Users]([UserID])
    );

    CREATE INDEX [IX_UserReports_ReportedUserID] ON [users].[UserReports]([ReportedUserID]);
    CREATE INDEX [IX_UserReports_Status] ON [users].[UserReports]([Status]);
    
    PRINT 'Table users.UserReports created successfully.';
END
ELSE
BEGIN
    PRINT 'Table users.UserReports already exists.';
END
GO
