/*
    Migration Script: Create Stored Procedure [sp_GetVendorBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_063_dbo.sp_GetVendorBookingsAll.sql
    Description: Creates the [vendors].[sp_GetBookingsAll] stored procedure
    
    Execution Order: 63
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_GetBookingsAll]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetBookingsAll]'))
    DROP PROCEDURE [vendors].[sp_GetBookingsAll];
GO

CREATE   PROCEDURE [vendors].[sp_GetBookingsAll]
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

PRINT 'Stored procedure [vendors].[sp_GetBookingsAll] created successfully.';
GO
