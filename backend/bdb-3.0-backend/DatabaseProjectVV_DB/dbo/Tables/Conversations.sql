CREATE TABLE [dbo].[Conversations] (
    [ConversationID]  INT            IDENTITY (1, 1) NOT NULL,
    [UserID]          INT            NULL,
    [VendorProfileID] INT            NULL,
    [BookingID]       INT            NULL,
    [Subject]         NVARCHAR (255) NULL,
    [LastMessageAt]   DATETIME       NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ConversationID] ASC),
    FOREIGN KEY ([BookingID]) REFERENCES [dbo].[Bookings] ([BookingID]),
    FOREIGN KEY ([UserID]) REFERENCES [dbo].[Users] ([UserID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

