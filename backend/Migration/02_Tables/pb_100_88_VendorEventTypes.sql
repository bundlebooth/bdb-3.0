/*
    Migration Script: Create Table [VendorEventTypes]
    Phase: 100 - Tables
    Script: pb_100_88_VendorEventTypes.sql
    Description: Creates the [vendors].[VendorEventTypes] junction table
    
    Execution Order: 88
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorEventTypes]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorEventTypes]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorEventTypes](
        [VendorEventTypeID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [EventTypeID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [VendorEventTypeID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [FK_VendorEventTypes_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_VendorEventTypes_EventTypes] FOREIGN KEY ([EventTypeID]) REFERENCES [admin].[EventTypes]([EventTypeID]),
    CONSTRAINT [UQ_VendorEventTypes] UNIQUE NONCLUSTERED ([VendorProfileID], [EventTypeID])
    );
    PRINT 'Table [vendors].[VendorEventTypes] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorEventTypes] already exists. Skipping.';
END
GO
