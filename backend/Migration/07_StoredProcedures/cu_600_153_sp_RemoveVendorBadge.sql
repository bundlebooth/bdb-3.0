-- =============================================
-- Stored Procedure: Remove Vendor Badge
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_RemoveVendorBadge]') AND type in (N'P'))
    DROP PROCEDURE [vendors].[sp_RemoveVendorBadge];
GO

CREATE PROCEDURE [vendors].[sp_RemoveVendorBadge]
    @VendorProfileID INT,
    @BadgeID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [vendors].[VendorBadges]
    SET IsActive = 0, UpdatedAt = GETDATE()
    WHERE BadgeID = @BadgeID AND VendorProfileID = @VendorProfileID;
END
GO
