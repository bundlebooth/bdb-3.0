/*
    Migration Script: Create Stored Procedure [sp_GetUserBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_053_dbo.sp_GetUserBookingsAll.sql
    Description: Creates the [dbo].[sp_GetUserBookingsAll] stored procedure
    
    Execution Order: 53
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetUserBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetUserBookingsAll]'))
    DROP PROCEDURE [dbo].[sp_GetUserBookingsAll];
GO

CREATE   PROCEDURE [dbo].[sp_GetUserBookingsAll]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT *
    FROM vw_UserBookings
    WHERE UserID = @UserID
    ORDER BY EventDate DESC;
END;

GO

PRINT 'Stored procedure [dbo].[sp_GetUserBookingsAll] created successfully.';
GO
