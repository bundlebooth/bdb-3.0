-- Vendor Cancellation Policies Table
-- Stores configurable cancellation policies for each vendor

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'CancellationPolicies' AND schema_id = SCHEMA_ID('vendors'))
BEGIN
    CREATE TABLE vendors.CancellationPolicies (
        PolicyID INT IDENTITY(1,1) PRIMARY KEY,
        VendorProfileID INT NOT NULL,
        PolicyName NVARCHAR(100) NOT NULL DEFAULT 'Standard Policy',
        
        -- Cancellation windows (hours before event)
        FullRefundHours INT NOT NULL DEFAULT 168, -- 7 days = full refund
        PartialRefundHours INT NOT NULL DEFAULT 48, -- 48 hours = partial refund
        NoRefundHours INT NOT NULL DEFAULT 24, -- Less than 24 hours = no refund
        
        -- Refund percentages
        FullRefundPercent DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        PartialRefundPercent DECIMAL(5,2) NOT NULL DEFAULT 50.00,
        
        -- Policy text shown to clients
        PolicyDescription NVARCHAR(MAX) NULL,
        
        -- Whether vendor allows client-initiated cancellations
        AllowClientCancellation BIT NOT NULL DEFAULT 1,
        
        -- Whether vendor allows their own cancellations
        AllowVendorCancellation BIT NOT NULL DEFAULT 1,
        
        -- Penalty for vendor cancellation (percentage of booking value)
        VendorCancellationPenalty DECIMAL(5,2) NOT NULL DEFAULT 0.00,
        
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        UpdatedAt DATETIME2 NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT FK_CancellationPolicies_VendorProfile 
            FOREIGN KEY (VendorProfileID) REFERENCES vendors.VendorProfiles(VendorProfileID)
    );
    
    CREATE INDEX IX_CancellationPolicies_VendorProfileID 
        ON vendors.CancellationPolicies(VendorProfileID);
END
GO
