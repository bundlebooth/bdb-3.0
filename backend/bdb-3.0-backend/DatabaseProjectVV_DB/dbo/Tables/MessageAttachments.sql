CREATE TABLE [dbo].[MessageAttachments] (
    [AttachmentID] INT            IDENTITY (1, 1) NOT NULL,
    [MessageID]    INT            NULL,
    [FileURL]      NVARCHAR (255) NOT NULL,
    [FileType]     NVARCHAR (50)  NULL,
    [FileSize]     INT            NULL,
    [OriginalName] NVARCHAR (255) NULL,
    PRIMARY KEY CLUSTERED ([AttachmentID] ASC),
    FOREIGN KEY ([MessageID]) REFERENCES [dbo].[Messages] ([MessageID])
);


GO

