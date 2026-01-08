-- =============================================
-- Stored Procedure: vendors.sp_UpsertBusinessHours
-- Description: Inserts or updates business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpsertBusinessHours]'))
    DROP PROCEDURE [vendors].[sp_UpsertBusinessHours];
GO

CREATE PROCEDURE [vendors].[sp_UpsertBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek NVARCHAR(20),
    @IsAvailable BIT,
    @OpenTime TIME,
    @CloseTime TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM vendors.VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek)
        UPDATE vendors.VendorBusinessHours SET IsAvailable = @IsAvailable, OpenTime = @OpenTime, CloseTime = @CloseTime
        WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
    ELSE
        INSERT INTO vendors.VendorBusinessHours (VendorProfileID, DayOfWeek, IsAvailable, OpenTime, CloseTime)
        VALUES (@VendorProfileID, @DayOfWeek, @IsAvailable, @OpenTime, @CloseTime);
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

