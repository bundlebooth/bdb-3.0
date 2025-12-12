CREATE TABLE [dbo].[CommissionSettings] (
    [SettingID]    INT             IDENTITY (1, 1) NOT NULL,
    [SettingKey]   NVARCHAR (100)  NOT NULL,
    [SettingValue] NVARCHAR (500)  NOT NULL,
    [Description]  NVARCHAR (500)  NULL,
    [SettingType]  NVARCHAR (50)   DEFAULT ('percentage') NULL,
    [MinValue]     DECIMAL (10, 2) NULL,
    [MaxValue]     DECIMAL (10, 2) NULL,
    [IsActive]     BIT             DEFAULT ((1)) NULL,
    [CreatedAt]    DATETIME2 (7)   DEFAULT (getutcdate()) NULL,
    [UpdatedAt]    DATETIME2 (7)   DEFAULT (getutcdate()) NULL,
    PRIMARY KEY CLUSTERED ([SettingID] ASC),
    UNIQUE NONCLUSTERED ([SettingKey] ASC)
);


GO

