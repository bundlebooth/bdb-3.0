CREATE TABLE [dbo].[SecuritySettings] (
    [SettingID]    INT            IDENTITY (1, 1) NOT NULL,
    [SettingKey]   NVARCHAR (100) NOT NULL,
    [SettingValue] NVARCHAR (500) NOT NULL,
    [Description]  NVARCHAR (500) NULL,
    [IsActive]     BIT            DEFAULT ((1)) NULL,
    [UpdatedAt]    DATETIME       DEFAULT (getutcdate()) NULL,
    [UpdatedBy]    INT            NULL,
    PRIMARY KEY CLUSTERED ([SettingID] ASC),
    UNIQUE NONCLUSTERED ([SettingKey] ASC)
);


GO

