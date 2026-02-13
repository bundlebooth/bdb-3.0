/*
    Migration Script: Stored Procedure - Grant Badge to Vendor
    Phase: 700 - Stored Procedures
    Script: pb_700_402_sp_VendorBadges_Grant.sql
    Description: Grants a badge to a vendor
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_VendorBadges_Grant]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_VendorBadges_Grant];
GO

CREATE PROCEDURE [vendors].[sp_VendorBadges_Grant]
    @VendorProfileID INT,
    @BadgeID INT,
    @GrantedByUserID INT = NULL,
    @Notes NVARCHAR(500) = NULL,
    @ExpiresAt DATETIME2 = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @GrantID INT;
    DECLARE @BadgeName NVARCHAR(100);
    DECLARE @BadgeKey NVARCHAR(50);
    DECLARE @VendorUserID INT;
    DECLARE @BusinessName NVARCHAR(255);
    
    -- Get badge name and key
    SELECT @BadgeName = BadgeName, @BadgeKey = BadgeKey FROM [vendors].[VendorBadges] WHERE BadgeID = @BadgeID;
    
    -- Get vendor info
    SELECT @VendorUserID = UserID, @BusinessName = BusinessName 
    FROM [vendors].[VendorProfiles] WHERE VendorProfileID = @VendorProfileID;
    
    -- Check if already has active grant
    IF EXISTS (
        SELECT 1 FROM [vendors].[VendorBadgeGrants] 
        WHERE VendorProfileID = @VendorProfileID AND BadgeID = @BadgeID AND IsActive = 1
    )
    BEGIN
        SELECT 
            0 AS Success,
            'Vendor already has this badge' AS Message,
            NULL AS GrantID;
        RETURN;
    END
    
    -- Create the grant
    INSERT INTO [vendors].[VendorBadgeGrants] (VendorProfileID, BadgeID, GrantedByUserID, Notes, ExpiresAt)
    VALUES (@VendorProfileID, @BadgeID, @GrantedByUserID, @Notes, @ExpiresAt);
    
    SET @GrantID = SCOPE_IDENTITY();
    
    SELECT 
        1 AS Success,
        'Badge granted successfully' AS Message,
        @GrantID AS GrantID,
        @BadgeName AS BadgeName,
        @BadgeKey AS BadgeKey,
        @VendorUserID AS VendorUserID,
        @BusinessName AS BusinessName;
END
GO

PRINT 'Created stored procedure: [vendors].[sp_VendorBadges_Grant]';
GO
