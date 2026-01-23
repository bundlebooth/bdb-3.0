-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_UpdatePopularFilters
-- Description: Updates vendor popular filters
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_UpdatePopularFilters]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_UpdatePopularFilters];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_UpdatePopularFilters]
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
    
    UPDATE vendors.VendorProfiles SET 
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

