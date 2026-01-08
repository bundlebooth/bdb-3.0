-- =============================================
-- Stored Procedure: vendors.sp_UpdateFilters
-- Description: Updates vendor filters/badges
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateFilters]'))
    DROP PROCEDURE [vendors].[sp_UpdateFilters];
GO

CREATE PROCEDURE [vendors].[sp_UpdateFilters]
    @VendorProfileID INT,
    @IsPremium BIT = 0,
    @IsEcoFriendly BIT = 0,
    @IsAwardWinning BIT = 0,
    @IsLastMinute BIT = 0,
    @IsCertified BIT = 0,
    @IsInsured BIT = 0,
    @IsLocal BIT = 0,
    @IsMobile BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET IsPremium = @IsPremium, 
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

