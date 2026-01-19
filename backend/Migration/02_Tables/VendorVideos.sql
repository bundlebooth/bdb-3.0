-- Create VendorVideos table for storing YouTube video URLs
-- This table stores vendor YouTube video links for their gallery

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorVideos]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorVideos] (
        [VideoID] INT IDENTITY(1,1) PRIMARY KEY,
        [VendorProfileID] INT NOT NULL,
        [VideoURL] NVARCHAR(500) NOT NULL,
        [YouTubeVideoID] NVARCHAR(50) NULL,
        [Title] NVARCHAR(255) NULL,
        [SortOrder] INT NOT NULL DEFAULT 0,
        [CreatedAt] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME2 NULL,
        CONSTRAINT [FK_VendorVideos_VendorProfiles] FOREIGN KEY ([VendorProfileID]) 
            REFERENCES [vendors].[VendorProfiles]([VendorProfileID]) ON DELETE CASCADE
    );

    -- Create index for faster lookups by vendor
    CREATE NONCLUSTERED INDEX [IX_VendorVideos_VendorProfileID] 
        ON [vendors].[VendorVideos] ([VendorProfileID]) 
        INCLUDE ([VideoURL], [YouTubeVideoID], [Title], [SortOrder]);

    PRINT 'Created vendors.VendorVideos table';
END
ELSE
BEGIN
    PRINT 'vendors.VendorVideos table already exists';
END
GO
