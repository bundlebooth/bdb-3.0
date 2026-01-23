/*
    Migration Script: Create Stored Procedure [sp_AddVendorSocialMedia]
    Phase: 600 - Stored Procedures
    Script: cu_600_009_dbo.sp_AddVendorSocialMedia.sql
    Description: Creates the [vendors].[sp_AddSocialMedia] stored procedure
    
    Execution Order: 9
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_AddSocialMedia]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_AddSocialMedia]'))
    DROP PROCEDURE [vendors].[sp_AddSocialMedia];
GO

CREATE   PROCEDURE [vendors].[sp_AddSocialMedia]
    @VendorProfileID INT,
    @Platform NVARCHAR(50),
    @URL NVARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Use MERGE for upsert functionality
    MERGE VendorSocialMedia AS target
    USING (SELECT @VendorProfileID AS VendorProfileID, @Platform AS Platform, @URL AS URL) AS source
    ON target.VendorProfileID = source.VendorProfileID AND target.Platform = source.Platform
    WHEN MATCHED THEN
        UPDATE SET URL = source.URL
    WHEN NOT MATCHED THEN
        INSERT (VendorProfileID, Platform, URL, DisplayOrder)
        VALUES (source.VendorProfileID, source.Platform, source.URL, 
                (SELECT ISNULL(MAX(DisplayOrder), 0) + 1 FROM vendors.VendorSocialMedia WHERE VendorProfileID = @VendorProfileID));
    
    -- Update progress
    UPDATE vendors.VendorProfiles SET SocialMediaCompleted = 1, SetupStep = CASE WHEN SetupStep < 3 THEN 3 ELSE SetupStep END
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT 1 AS Success, 'Social media link added successfully' AS Message;
END;

GO

PRINT 'Stored procedure [vendors].[sp_AddSocialMedia] created successfully.';
GO


