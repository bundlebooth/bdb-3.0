/*
    Migration Script: Create Stored Procedure [sp_GetVendorBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_063_dbo.sp_GetVendorBookingsAll.sql
    Description: Creates the [dbo].[sp_GetVendorBookingsAll] stored procedure
    
    Execution Order: 63
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorBookingsAll]'))
    DROP PROCEDURE [dbo].[sp_GetVendorBookingsAll];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorBookingsAll]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM vw_VendorBookings
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY EventDate DESC;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorBookingsAll] created successfully.';
GO
