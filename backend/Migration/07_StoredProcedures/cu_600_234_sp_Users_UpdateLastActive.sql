/*
    Migration Script: Create Stored Procedure [sp_UpdateLastActive]
    Phase: 600 - Stored Procedures
    Script: cu_600_234_sp_Users_UpdateLastActive.sql
    Description: Updates user's LastActiveAt timestamp for online status tracking
    Schema: users
    
    Execution Order: 234
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [users].[sp_UpdateLastActive]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_UpdateLastActive]'))
    DROP PROCEDURE [users].[sp_UpdateLastActive];
GO

CREATE PROCEDURE [users].[sp_UpdateLastActive]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [users].[Users]
    SET [LastActiveAt] = GETDATE()
    WHERE [UserID] = @UserID;
END;
GO

PRINT 'Stored procedure [users].[sp_UpdateLastActive] created successfully.';
GO
