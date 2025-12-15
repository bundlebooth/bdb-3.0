/*
    Migration Script: Create Stored Procedure [sp_TrackVendorProfileView]
    Phase: 600 - Stored Procedures
    Script: cu_600_096_dbo.sp_TrackVendorProfileView.sql
    Description: Creates the [dbo].[sp_TrackVendorProfileView] stored procedure
    
    Execution Order: 96
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_TrackVendorProfileView]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_TrackVendorProfileView]'))
    DROP PROCEDURE [dbo].[sp_TrackVendorProfileView];
GO

CREATE   PROCEDURE [dbo].[sp_TrackVendorProfileView]
    @VendorProfileID INT,
    @ViewerUserID INT = NULL,
    @IPAddress VARCHAR(45) = NULL,
    @UserAgent VARCHAR(500) = NULL,
    @ReferrerUrl VARCHAR(1000) = NULL,
    @SessionID VARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Validate vendor exists
    IF NOT EXISTS (SELECT 1 FROM VendorProfiles WHERE VendorProfileID = @VendorProfileID)
    BEGIN
        RAISERROR('Vendor not found', 16, 1);
        RETURN;
    END

    -- Insert the view record
    INSERT INTO VendorProfileViews (
        VendorProfileID, 
        ViewerUserID, 
        ViewedAt, 
        IPAddress, 
        UserAgent, 
        ReferrerUrl, 
        SessionID
    )
    VALUES (
        @VendorProfileID,
        @ViewerUserID,
        GETUTCDATE(),
        @IPAddress,
        @UserAgent,
        @ReferrerUrl,
        @SessionID
    );

    SELECT 
        SCOPE_IDENTITY() AS ViewID,
        GETUTCDATE() AS ViewedAt;
END

GO

PRINT 'Stored procedure [dbo].[sp_TrackVendorProfileView] created successfully.';
GO
