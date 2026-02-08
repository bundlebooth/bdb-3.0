/*
    Migration Script: Create Table [UserProfiles]
    Phase: 100 - Tables
    Script: pb_100_80_UserProfiles.sql
    Description: Creates the [users].[UserProfiles] table for Planbeau user profile information
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[UserProfiles]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserProfiles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[UserProfiles](
        [UserProfileID] INT IDENTITY(1,1) NOT NULL,
        [UserID] INT NOT NULL,
        
        -- Basic Info
        [DisplayName] NVARCHAR(100) NULL,
        [LifeMotto] NVARCHAR(100) NULL,              -- "A phrase that defines you"
        [Bio] NVARCHAR(MAX) NULL,                    -- "About me"
        [ProfileImageURL] NVARCHAR(500) NULL,
        
        -- Location
        [City] NVARCHAR(100) NULL,                   -- "Where are you based?"
        [State] NVARCHAR(100) NULL,
        [Country] NVARCHAR(100) NULL,
        
        -- Personal Details
        [Occupation] NVARCHAR(200) NULL,             -- "What do you do?"
        [Education] NVARCHAR(200) NULL,              -- "Where did you study?"
        [Languages] NVARCHAR(500) NULL,              -- "What languages do you speak?"
        [Generation] NVARCHAR(20) NULL,              -- "Which era are you from?"
        
        -- Fun Facts
        [CurrentPassion] NVARCHAR(200) NULL,         -- "What excites you lately?"
        [FurryFriends] NVARCHAR(200) NULL,           -- "Any pets at home?"
        [FreeTimeActivity] NVARCHAR(200) NULL,       -- "How do you unwind?"
        [InterestingTidbit] NVARCHAR(300) NULL,      -- "Something unique about you"
        [HiddenTalent] NVARCHAR(200) NULL,           -- "A quirky skill you have"
        [DreamDestination] NVARCHAR(500) NULL,       -- "A place on your bucket list"
        
        -- Stats & Status
        [ProfileCompleteness] INT NULL DEFAULT 0,
        [IsCompleted] BIT NULL DEFAULT 0,
        [IsVisible] BIT NOT NULL DEFAULT 1,
        
        -- Timestamps
        [CreatedAt] DATETIME NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NULL DEFAULT GETDATE(),
        
        CONSTRAINT [PK_UserProfiles] PRIMARY KEY CLUSTERED ([UserProfileID] ASC),
        CONSTRAINT [FK_UserProfiles_Users] FOREIGN KEY ([UserID]) REFERENCES [users].[Users]([UserID]) ON DELETE CASCADE,
        CONSTRAINT [UQ_UserProfiles_UserID] UNIQUE ([UserID])
    );
    
    CREATE INDEX [IX_UserProfiles_UserID] ON [users].[UserProfiles]([UserID]);
    
    PRINT 'Table [users].[UserProfiles] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[UserProfiles] already exists. Skipping.';
END
GO
