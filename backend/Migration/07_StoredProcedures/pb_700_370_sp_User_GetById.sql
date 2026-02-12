/*
    Migration Script: Stored Procedure - Get User By ID
    Phase: 700 - Stored Procedures
    Script: pb_700_370_sp_User_GetById.sql
    Description: Gets user info by UserID for notification service.
    
    Created: 2026-02-12
*/

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[sp_User_GetById]') AND type in (N'P', N'PC'))
    DROP PROCEDURE [users].[sp_User_GetById];
GO

CREATE PROCEDURE [users].[sp_User_GetById]
    @UserID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT UserID, Email, FirstName, LastName
    FROM [users].[Users]
    WHERE UserID = @UserID;
END
GO

PRINT 'Created stored procedure: [users].[sp_User_GetById]';
GO
