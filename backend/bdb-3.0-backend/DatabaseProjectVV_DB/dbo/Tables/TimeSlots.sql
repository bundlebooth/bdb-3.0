CREATE TABLE [dbo].[TimeSlots] (
    [SlotID]          INT      IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT      NULL,
    [ServiceID]       INT      NULL,
    [DayOfWeek]       TINYINT  NULL,
    [Date]            DATE     NULL,
    [StartTime]       TIME (7) NOT NULL,
    [EndTime]         TIME (7) NOT NULL,
    [MaxCapacity]     INT      NULL,
    [IsAvailable]     BIT      DEFAULT ((1)) NULL,
    PRIMARY KEY CLUSTERED ([SlotID] ASC),
    CHECK ([DayOfWeek]>=(0) AND [DayOfWeek]<=(6)),
    CONSTRAINT [CHK_DayOrDate] CHECK ([DayOfWeek] IS NOT NULL AND [Date] IS NULL OR [DayOfWeek] IS NULL AND [Date] IS NOT NULL),
    FOREIGN KEY ([ServiceID]) REFERENCES [dbo].[Services] ([ServiceID]),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

