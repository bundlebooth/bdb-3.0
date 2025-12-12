CREATE TABLE [dbo].[EmailTemplateComponents] (
    [ComponentID]   INT            IDENTITY (1, 1) NOT NULL,
    [ComponentType] NVARCHAR (20)  NOT NULL,
    [ComponentName] NVARCHAR (100) NOT NULL,
    [HtmlContent]   NVARCHAR (MAX) NOT NULL,
    [TextContent]   NVARCHAR (MAX) NULL,
    [Description]   NVARCHAR (500) NULL,
    [IsActive]      BIT            DEFAULT ((1)) NULL,
    [CreatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]     DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ComponentID] ASC),
    CONSTRAINT [CK_ComponentType] CHECK ([ComponentType]='body' OR [ComponentType]='footer' OR [ComponentType]='header')
);


GO

CREATE NONCLUSTERED INDEX [IX_EmailTemplateComponents_Type]
    ON [dbo].[EmailTemplateComponents]([ComponentType] ASC, [IsActive] ASC);


GO

