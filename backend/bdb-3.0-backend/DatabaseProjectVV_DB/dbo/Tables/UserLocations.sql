CREATE TABLE [dbo].[UserLocations] (
    [LocationID] INT             IDENTITY (1, 1) NOT NULL,
    [UserID]     INT             NULL,
    [Latitude]   DECIMAL (10, 8) NOT NULL,
    [Longitude]  DECIMAL (11, 8) NOT NULL,
    [City]       NVARCHAR (100)  NULL,
    [State]      NVARCHAR (50)   NULL,
    [Country]    NVARCHAR (50)   NULL,
    [Timestamp]  DATETIME        DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([LocationID] ASC),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID])
);


GO

