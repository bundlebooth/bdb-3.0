/*
    Migration Script: Stored Procedure - Revoke Badge from Vendor
    Phase: 700 - Stored Procedures
    Script: pb_700_403_sp_VendorBadges_Revoke.sql
    Description: Revokes a badge from a vendor
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_VendorBadges_Revoke]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [vendors].[sp_VendorBadges_Revoke];
GO

CREATE PROCEDURE [vendors].[sp_VendorBadges_Revoke]
    @VendorProfileID INT,
    @BadgeID INT,
    @RevokedByUserID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if has active grant
    IF NOT EXISTS (
        SELECT 1 FROM [vendors].[VendorBadgeGrants] 
        WHERE VendorProfileID = @VendorProfileID AND BadgeID = @BadgeID AND IsActive = 1
    )
    BEGIN
        SELECT 
            0 AS Success,
            'Vendor does not have this badge' AS Message;
        RETURN;
    END
    
    -- Revoke the badge
    UPDATE [vendors].[VendorBadgeGrants]
    SET IsActive = 0,
        RevokedAt = GETDATE(),
        RevokedByUserID = @RevokedByUserID
    WHERE VendorProfileID = @VendorProfileID AND BadgeID = @BadgeID AND IsActive = 1;
    
    SELECT 
        1 AS Success,
        'Badge revoked successfully' AS Message;
END
GO

PRINT 'Created stored procedure: [vendors].[sp_VendorBadges_Revoke]';
GO
