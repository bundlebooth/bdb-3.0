CREATE TABLE [dbo].[EmailLogs] (
    [EmailLogID]     INT            IDENTITY (1, 1) NOT NULL,
    [TemplateKey]    NVARCHAR (50)  NULL,
    [RecipientEmail] NVARCHAR (255) NOT NULL,
    [RecipientName]  NVARCHAR (100) NULL,
    [Subject]        NVARCHAR (255) NOT NULL,
    [Status]         NVARCHAR (20)  DEFAULT ('sent') NOT NULL,
    [ErrorMessage]   NVARCHAR (MAX) NULL,
    [UserID]         INT            NULL,
    [BookingID]      INT            NULL,
    [Metadata]       NVARCHAR (MAX) NULL,
    [SentAt]         DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([EmailLogID] ASC),
    CONSTRAINT [CK_EmailStatus] CHECK ([Status]='pending' OR [Status]='failed' OR [Status]='sent'),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

CREATE NONCLUSTERED INDEX [IX_EmailLogs_Recipient]
    ON [dbo].[EmailLogs]([RecipientEmail] ASC, [SentAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailLogs_User]
    ON [dbo].[EmailLogs]([UserID] ASC, [SentAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailLogs_Template]
    ON [dbo].[EmailLogs]([TemplateKey] ASC, [SentAt] DESC);


GO

CREATE NONCLUSTERED INDEX [IX_EmailLogs_Status]
    ON [dbo].[EmailLogs]([Status] ASC, [SentAt] DESC);


GO

