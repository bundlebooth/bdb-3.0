/*
    Migration Script: Create Table [UserInterests]
    Phase: 100 - Tables
    Script: pb_100_81_UserInterests.sql
    Description: Creates the [users].[UserInterests] table for storing user interests/passions
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[UserInterests]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserInterests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[UserInterests](
        [UserInterestID] INT IDENTITY(1,1) NOT NULL,
        [UserProfileID] INT NOT NULL,
        [Interest] NVARCHAR(100) NOT NULL,
        [Category] NVARCHAR(50) NULL,
        [DisplayOrder] INT NULL DEFAULT 0,
        [CreatedAt] DATETIME NULL DEFAULT GETDATE(),
        CONSTRAINT [PK_UserInterests] PRIMARY KEY CLUSTERED ([UserInterestID] ASC),
        CONSTRAINT [FK_UserInterests_UserProfiles] FOREIGN KEY ([UserProfileID]) REFERENCES [users].[UserProfiles]([UserProfileID]) ON DELETE CASCADE
    );
    
    CREATE INDEX [IX_UserInterests_UserProfileID] ON [users].[UserInterests]([UserProfileID]);
    
    PRINT 'Table [users].[UserInterests] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[UserInterests] already exists. Skipping.';
END
GO
