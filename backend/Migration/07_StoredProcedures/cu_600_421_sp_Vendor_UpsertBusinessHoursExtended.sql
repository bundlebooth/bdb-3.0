-- =============================================
-- Stored Procedure: vendors.sp_UpsertBusinessHoursExtended
-- Description: Inserts or updates business hours with timezone
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertBusinessHoursExtended]'))
    DROP PROCEDURE [vendors].[sp_UpsertBusinessHoursExtended];
GO

CREATE PROCEDURE [vendors].[sp_UpsertBusinessHoursExtended]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @IsAvailable BIT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8),
    @Timezone NVARCHAR(100) = 'America/New_York'
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek)
        UPDATE vendors.VendorBusinessHours SET IsAvailable = @IsAvailable, OpenTime = @OpenTime, CloseTime = @CloseTime, Timezone = @Timezone
        WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
    ELSE
        INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, IsAvailable, OpenTime, CloseTime, Timezone)
        VALUES (@VendorProfileID, @DayOfWeek, @IsAvailable, @OpenTime, @CloseTime, @Timezone);
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

