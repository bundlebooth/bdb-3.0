-- =============================================
-- Stored Procedure: vendors.sp_UpsertBusinessHours
-- Description: Inserts or updates vendor business hours
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_UpsertBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_UpsertBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @IsAvailable BIT,
    @OpenTime TIME,
    @CloseTime TIME,
    @Timezone NVARCHAR(100) = 'America/New_York'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek)
        UPDATE vendors.VendorBusinessHours 
        SET IsAvailable = @IsAvailable, OpenTime = @OpenTime, CloseTime = @CloseTime, Timezone = @Timezone, UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
    ELSE
        INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, IsAvailable, OpenTime, CloseTime, Timezone)
        VALUES (@VendorProfileID, @DayOfWeek, @IsAvailable, @OpenTime, @CloseTime, @Timezone);
END
GO

