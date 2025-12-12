CREATE TABLE [dbo].[BookingTimeline] (
    [TimelineID] INT            IDENTITY (1, 1) NOT NULL,
    [BookingID]  INT            NULL,
    [Status]     NVARCHAR (50)  NOT NULL,
    [ChangedBy]  INT            NULL,
    [Notes]      NVARCHAR (MAX) NULL,
    [CreatedAt]  DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([TimelineID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([ChangedBy]) REFERENCES [dbo].[Users] ([UserID])
);


GO

