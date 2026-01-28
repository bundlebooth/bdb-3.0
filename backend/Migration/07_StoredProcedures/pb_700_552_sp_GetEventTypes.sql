/*
    Migration Script: Create Stored Procedure [sp_GetEventTypes]
    Phase: 700 - Stored Procedures
    Script: pb_700_552_sp_GetEventTypes.sql
    Description: Gets all active event types for lookup
    
    Execution Order: 552
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [admin].[sp_GetEventTypes]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetEventTypes]'))
    DROP PROCEDURE [admin].[sp_GetEventTypes];
GO

CREATE PROCEDURE [admin].[sp_GetEventTypes]
    @IncludeInactive BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        EventTypeID,
        EventTypeKey,
        EventTypeName,
        DisplayOrder,
        IsActive
    FROM [admin].[EventTypes]
    WHERE (@IncludeInactive = 1 OR IsActive = 1)
    ORDER BY DisplayOrder ASC;
END;
GO

PRINT 'Stored procedure [admin].[sp_GetEventTypes] created successfully.';
GO
