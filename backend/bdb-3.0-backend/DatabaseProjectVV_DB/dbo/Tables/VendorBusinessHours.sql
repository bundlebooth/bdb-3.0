CREATE TABLE [dbo].[VendorBusinessHours] (
    [HoursID]         INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [DayOfWeek]       TINYINT        NULL,
    [OpenTime]        TIME (7)       NULL,
    [CloseTime]       TIME (7)       NULL,
    [IsAvailable]     BIT            DEFAULT ((1)) NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [Timezone]        NVARCHAR (100) DEFAULT ('America/New_York') NULL,
    PRIMARY KEY CLUSTERED ([HoursID] ASC),
    CHECK ([DayOfWeek]>=(0) AND [DayOfWeek]<=(6)),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID]),
    CONSTRAINT [UC_VendorDay] UNIQUE NONCLUSTERED ([VendorProfileID] ASC, [DayOfWeek] ASC)
);


GO

