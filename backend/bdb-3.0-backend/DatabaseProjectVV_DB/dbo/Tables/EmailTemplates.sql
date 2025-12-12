CREATE TABLE [dbo].[EmailTemplates] (
    [TemplateID]         INT            IDENTITY (1, 1) NOT NULL,
    [TemplateKey]        NVARCHAR (50)  NOT NULL,
    [TemplateName]       NVARCHAR (100) NOT NULL,
    [HeaderComponentID]  INT            NULL,
    [BodyComponentID]    INT            NOT NULL,
    [FooterComponentID]  INT            NULL,
    [Subject]            NVARCHAR (255) NOT NULL,
    [Category]           NVARCHAR (50)  NULL,
    [AvailableVariables] NVARCHAR (MAX) NULL,
    [IsActive]           BIT            DEFAULT ((1)) NULL,
    [CreatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]          DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TemplateID] ASC),
    FOREIGN KEY ([BodyComponentID]) REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID]),
    FOREIGN KEY ([FooterComponentID]) REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID]),
    FOREIGN KEY ([HeaderComponentID]) REFERENCES [dbo].[EmailTemplateComponents] ([ComponentID]),
    UNIQUE NONCLUSTERED ([TemplateKey] ASC)
);


GO

CREATE NONCLUSTERED INDEX [IX_EmailTemplates_Key]
    ON [dbo].[EmailTemplates]([TemplateKey] ASC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailTemplates_Category]
    ON [dbo].[EmailTemplates]([Category] ASC, [IsActive] ASC);


GO

