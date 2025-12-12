CREATE TABLE [dbo].[ServiceAddOns] (
    [AddOnID]     INT             IDENTITY (1, 1) NOT NULL,
    [ServiceID]   INT             NULL,
    [Name]        NVARCHAR (100)  NOT NULL,
    [Description] NVARCHAR (MAX)  NULL,
    [Price]       DECIMAL (10, 2) NOT NULL,
    [IsActive]    BIT             DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([AddOnID] ASC),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID])
);


GO

