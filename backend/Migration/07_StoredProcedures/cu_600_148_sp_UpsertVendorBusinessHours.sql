-- =============================================
-- Stored Procedure: sp_UpsertVendorBusinessHours
-- Description: Inserts or updates vendor business hours
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpsertVendorBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_UpsertVendorBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_UpsertVendorBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek TINYINT,
    @IsAvailable BIT,
    @OpenTime TIME,
    @CloseTime TIME,
    @Timezone NVARCHAR(100) = 'America/New_York'
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek)
        UPDATE VendorBusinessHours 
        SET IsAvailable = @IsAvailable, OpenTime = @OpenTime, CloseTime = @CloseTime, Timezone = @Timezone, UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
    ELSE
        INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, IsAvailable, OpenTime, CloseTime, Timezone)
        VALUES (@VendorProfileID, @DayOfWeek, @IsAvailable, @OpenTime, @CloseTime, @Timezone);
END
GO
