/*
    Migration Script: Create Table [VendorCultures]
    Phase: 100 - Tables
    Script: pb_100_90_VendorCultures.sql
    Description: Creates the [vendors].[VendorCultures] junction table
    
    Execution Order: 90
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorCultures]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCultures]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorCultures](
        [VendorCultureID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [CultureID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [VendorCultureID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [FK_VendorCultures_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_VendorCultures_Cultures] FOREIGN KEY ([CultureID]) REFERENCES [admin].[Cultures]([CultureID]),
    CONSTRAINT [UQ_VendorCultures] UNIQUE NONCLUSTERED ([VendorProfileID], [CultureID])
    );
    PRINT 'Table [vendors].[VendorCultures] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorCultures] already exists. Skipping.';
END
GO
