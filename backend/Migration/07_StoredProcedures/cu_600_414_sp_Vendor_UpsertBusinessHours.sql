-- =============================================
-- Stored Procedure: sp_Vendor_UpsertBusinessHours
-- Description: Inserts or updates business hours for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpsertBusinessHours]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpsertBusinessHours];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpsertBusinessHours]
    @VendorProfileID INT,
    @DayOfWeek NVARCHAR(20),
    @IsAvailable BIT,
    @OpenTime TIME,
    @CloseTime TIME
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM VendorBusinessHours WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek)
        UPDATE VendorBusinessHours SET IsAvailable = @IsAvailable, OpenTime = @OpenTime, CloseTime = @CloseTime
        WHERE VendorProfileID = @VendorProfileID AND DayOfWeek = @DayOfWeek;
    ELSE
        INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, IsAvailable, OpenTime, CloseTime)
        VALUES (@VendorProfileID, @DayOfWeek, @IsAvailable, @OpenTime, @CloseTime);
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
