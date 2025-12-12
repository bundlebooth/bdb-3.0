CREATE TABLE [dbo].[ServiceAvailability] (
    [AvailabilityID] INT            IDENTITY (1, 1) NOT NULL,
    [ServiceID]      INT            NULL,
    [StartDateTime]  DATETIME       NOT NULL,
    [EndDateTime]    DATETIME       NOT NULL,
    [IsAvailable]    BIT            DEFAULT ((1)) NULL,
    [Reason]         NVARCHAR (255) NULL,
    [CreatedAt]      DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([AvailabilityID] ASC),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID])
);


GO

