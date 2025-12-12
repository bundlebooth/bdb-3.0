CREATE TABLE [dbo].[VendorAvailabilityExceptions] (
    [ExceptionID]     INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID] INT            NULL,
    [Date]            DATE           NOT NULL,
    [IsAvailable]     BIT            DEFAULT ((0)) NULL,
    [Reason]          NVARCHAR (255) NULL,
    [StartTime]       TIME (7)       NULL,
    [EndTime]         TIME (7)       NULL,
    [CreatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    [UpdatedAt]       DATETIME       DEFAULT (getdate()) NULL,
    PRIMARY KEY CLUSTERED ([ExceptionID] ASC),
    FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

