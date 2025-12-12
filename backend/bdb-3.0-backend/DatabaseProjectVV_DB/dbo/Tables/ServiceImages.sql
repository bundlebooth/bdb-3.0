CREATE TABLE [dbo].[ServiceImages] (
    [ImageID]      INT            IDENTITY (1, 1) NOT NULL,
    [ServiceID]    INT            NULL,
    [ImageURL]     NVARCHAR (255) NOT NULL,
    [IsPrimary]    BIT            DEFAULT ((0)) NULL,
    [DisplayOrder] INT            DEFAULT ((0)) NULL,
    PRIMARY KEY CLUSTERED ([ImageID] ASC),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID])
);


GO

