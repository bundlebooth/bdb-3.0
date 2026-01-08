-- =============================================
-- Stored Procedure: Assign Vendor Badge
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_AssignVendorBadge]') AND type in (N'P'))
    DROP PROCEDURE [vendors].[sp_AssignVendorBadge];
GO

CREATE PROCEDURE [vendors].[sp_AssignVendorBadge]
    @VendorProfileID INT,
    @BadgeType NVARCHAR(50),
    @BadgeName NVARCHAR(100) = NULL,
    @Year INT = NULL,
    @ImageURL NVARCHAR(500) = NULL,
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Check if badge already exists for this vendor and type
    IF EXISTS (SELECT 1 FROM [vendors].[VendorBadges] 
               WHERE VendorProfileID = @VendorProfileID 
               AND BadgeType = @BadgeType 
               AND ([Year] = @Year OR (@Year IS NULL AND [Year] IS NULL))
               AND IsActive = 1)
    BEGIN
        -- Update existing badge
        UPDATE [vendors].[VendorBadges]
        SET BadgeName = ISNULL(@BadgeName, BadgeName),
            ImageURL = ISNULL(@ImageURL, ImageURL),
            Description = ISNULL(@Description, Description),
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID 
        AND BadgeType = @BadgeType 
        AND ([Year] = @Year OR (@Year IS NULL AND [Year] IS NULL))
        AND IsActive = 1;
        
        SELECT BadgeID FROM [vendors].[VendorBadges]
        WHERE VendorProfileID = @VendorProfileID 
        AND BadgeType = @BadgeType 
        AND ([Year] = @Year OR (@Year IS NULL AND [Year] IS NULL))
        AND IsActive = 1;
    END
    ELSE
    BEGIN
        -- Insert new badge
        INSERT INTO [vendors].[VendorBadges] (VendorProfileID, BadgeType, BadgeName, [Year], ImageURL, Description, IsActive, CreatedAt, UpdatedAt)
        OUTPUT INSERTED.BadgeID
        VALUES (@VendorProfileID, @BadgeType, @BadgeName, @Year, @ImageURL, @Description, 1, GETDATE(), GETDATE());
    END
END
GO
