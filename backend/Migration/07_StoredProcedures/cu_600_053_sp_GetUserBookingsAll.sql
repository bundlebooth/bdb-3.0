/*
    Migration Script: Create Stored Procedure [sp_GetUserBookingsAll]
    Phase: 600 - Stored Procedures
    Script: cu_600_053_dbo.sp_GetUserBookingsAll.sql
    Description: Creates the [users].[sp_GetBookingsAll] stored procedure
    
    Execution Order: 53
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_GetBookingsAll]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_GetBookingsAll]'))
    DROP PROCEDURE [users].[sp_GetBookingsAll];
GO

CREATE   PROCEDURE [users].[sp_GetBookingsAll]
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

PRINT 'Stored procedure [users].[sp_GetBookingsAll] created successfully.';
GO
