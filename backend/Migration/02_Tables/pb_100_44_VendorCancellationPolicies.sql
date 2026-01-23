/*
    Migration Script: Create Table [VendorCancellationPolicies]
    Phase: 100 - Tables
    Script: cu_100_58_VendorCancellationPolicies.sql
    Description: Creates the [vendors].[VendorCancellationPolicies] table for vendor cancellation settings
    
    Execution Order: 58
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorCancellationPolicies]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCancellationPolicies]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorCancellationPolicies](
        [PolicyID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [PolicyName] [nvarchar](100) NULL DEFAULT 'Standard',
        [FullRefundHours] [int] NULL DEFAULT 48,
        [PartialRefundHours] [int] NULL DEFAULT 24,
        [PartialRefundPercent] [decimal](5,2) NULL DEFAULT 50.00,
        [NoRefundHours] [int] NULL DEFAULT 0,
        [AllowClientCancellation] [bit] NULL DEFAULT 1,
        [AllowVendorCancellation] [bit] NULL DEFAULT 1,
        [CancellationFee] [decimal](10,2) NULL DEFAULT 0.00,
        [PolicyDescription] [nvarchar](max) NULL,
        [IsActive] [bit] NULL DEFAULT 1,
        [CreatedAt] [datetime] NULL DEFAULT GETDATE(),
        [UpdatedAt] [datetime] NULL DEFAULT GETDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [PolicyID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    
    -- Add foreign key to VendorProfiles
    ALTER TABLE [vendors].[VendorCancellationPolicies]
    ADD CONSTRAINT FK_VendorCancellationPolicies_VendorProfiles
    FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]);
    
    PRINT 'Table [vendors].[VendorCancellationPolicies] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorCancellationPolicies] already exists. Skipping.';
END
GO

