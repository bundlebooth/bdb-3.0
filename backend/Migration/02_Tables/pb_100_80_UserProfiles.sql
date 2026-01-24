/*
    Migration Script: Create Table [UserProfiles]
    Phase: 100 - Tables
    Script: pb_100_80_UserProfiles.sql
    Description: Creates the [users].[UserProfiles] table for Airbnb-style user profile information
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
        [BiographyTitle] NVARCHAR(100) NULL,
        [Bio] NVARCHAR(MAX) NULL,
        [ProfileImageURL] NVARCHAR(500) NULL,
        
        -- Location
        [City] NVARCHAR(100) NULL,
        [State] NVARCHAR(100) NULL,
        [Country] NVARCHAR(100) NULL,
        
        -- Personal Details
        [Work] NVARCHAR(200) NULL,
        [School] NVARCHAR(200) NULL,
        [Languages] NVARCHAR(500) NULL,
        [DecadeBorn] NVARCHAR(20) NULL,
        
        -- Fun Facts (Airbnb-style)
        [ObsessedWith] NVARCHAR(200) NULL,
        [Pets] NVARCHAR(200) NULL,
        [SpendTimeDoing] NVARCHAR(200) NULL,
        [FunFact] NVARCHAR(300) NULL,
        [UselessSkill] NVARCHAR(200) NULL,
        [FavoriteQuote] NVARCHAR(500) NULL,
        
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
