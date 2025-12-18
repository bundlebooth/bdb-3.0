-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdatePopularFilters
-- Description: Updates vendor popular filters
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdatePopularFilters]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdatePopularFilters];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdatePopularFilters]
    @VendorProfileID INT,
    @IsPremium BIT,
    @IsEcoFriendly BIT,
    @IsAwardWinning BIT,
    @IsLastMinute BIT,
    @IsCertified BIT,
    @IsInsured BIT,
    @IsLocal BIT,
    @IsMobile BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET 
        IsPremium = @IsPremium,
        IsEcoFriendly = @IsEcoFriendly,
        IsAwardWinning = @IsAwardWinning,
        IsLastMinute = @IsLastMinute,
        IsCertified = @IsCertified,
        IsInsured = @IsInsured,
        IsLocal = @IsLocal,
        IsMobile = @IsMobile,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
