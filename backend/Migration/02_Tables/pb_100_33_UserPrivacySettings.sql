-- =============================================
-- Table: users.UserPrivacySettings
-- Description: Stores user privacy preferences for activity visibility
-- =============================================
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserPrivacySettings]') AND type = 'U')
BEGIN
    CREATE TABLE [users].[UserPrivacySettings] (
        [PrivacySettingID] INT IDENTITY(1,1) PRIMARY KEY,
        [UserID] INT NOT NULL,
        [ShowReviews] BIT NOT NULL DEFAULT 1,
        [ShowForumPosts] BIT NOT NULL DEFAULT 1,
        [ShowForumComments] BIT NOT NULL DEFAULT 1,
        [ShowFavorites] BIT NOT NULL DEFAULT 1,
        [ShowOnlineStatus] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NULL,
        CONSTRAINT [FK_UserPrivacySettings_Users] FOREIGN KEY ([UserID]) REFERENCES [users].[Users]([UserID]) ON DELETE CASCADE,
        CONSTRAINT [UQ_UserPrivacySettings_UserID] UNIQUE ([UserID])
    );

    CREATE INDEX [IX_UserPrivacySettings_UserID] ON [users].[UserPrivacySettings]([UserID]);
    
    PRINT 'Table users.UserPrivacySettings created successfully.';
END
ELSE
BEGIN
    PRINT 'Table users.UserPrivacySettings already exists.';
END
GO
