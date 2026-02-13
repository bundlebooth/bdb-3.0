/*
    Migration Script: Create Table [vendors].[VendorBadgeGrants]
    Phase: 100 - Tables
    Script: pb_100_81_VendorBadgeGrants.sql
    Description: Creates the VendorBadgeGrants table for tracking badge grants to vendors
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorBadgeGrants]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorBadgeGrants] (
        GrantID INT IDENTITY(1,1) PRIMARY KEY,
        VendorProfileID INT NOT NULL,
        BadgeID INT NOT NULL,
        GrantedByUserID INT,  -- NULL if auto-granted
        GrantedAt DATETIME2 DEFAULT GETDATE(),
        ExpiresAt DATETIME2,  -- NULL means never expires
        RevokedAt DATETIME2,
        RevokedByUserID INT,
        IsActive BIT DEFAULT 1,
        Notes NVARCHAR(500),
        
        CONSTRAINT FK_VendorBadgeGrants_VendorProfile FOREIGN KEY (VendorProfileID) 
            REFERENCES [vendors].[VendorProfiles](VendorProfileID) ON DELETE CASCADE,
        CONSTRAINT FK_VendorBadgeGrants_Badge FOREIGN KEY (BadgeID) 
            REFERENCES [vendors].[VendorBadges](BadgeID) ON DELETE CASCADE,
        CONSTRAINT FK_VendorBadgeGrants_GrantedBy FOREIGN KEY (GrantedByUserID) 
            REFERENCES [users].[Users](UserID),
        CONSTRAINT FK_VendorBadgeGrants_RevokedBy FOREIGN KEY (RevokedByUserID) 
            REFERENCES [users].[Users](UserID),
        
        -- Ensure a vendor can only have one active grant per badge
        CONSTRAINT UQ_VendorBadgeGrants_Active UNIQUE (VendorProfileID, BadgeID, IsActive)
    );
    
    -- Create indexes for common queries
    CREATE INDEX IX_VendorBadgeGrants_VendorProfile ON [vendors].[VendorBadgeGrants](VendorProfileID) WHERE IsActive = 1;
    CREATE INDEX IX_VendorBadgeGrants_Badge ON [vendors].[VendorBadgeGrants](BadgeID) WHERE IsActive = 1;
    
    PRINT 'Created table: [vendors].[VendorBadgeGrants]';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorBadgeGrants] already exists';
END
GO
