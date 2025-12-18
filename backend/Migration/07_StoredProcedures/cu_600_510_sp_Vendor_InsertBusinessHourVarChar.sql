-- =============================================
-- Stored Procedure: sp_Vendor_InsertBusinessHourVarChar
-- Description: Inserts a business hour for a vendor using VarChar time
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertBusinessHourVarChar]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertBusinessHourVarChar];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertBusinessHourVarChar]
    @VendorProfileID INT,
    @DayOfWeek INT,
    @OpenTime VARCHAR(8),
    @CloseTime VARCHAR(8)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorBusinessHours (VendorProfileID, DayOfWeek, OpenTime, CloseTime, IsAvailable, CreatedAt, UpdatedAt)
    VALUES (@VendorProfileID, @DayOfWeek, @OpenTime, @CloseTime, 1, GETUTCDATE(), GETUTCDATE());
    
    SELECT SCOPE_IDENTITY() AS BusinessHourID;
END
GO
