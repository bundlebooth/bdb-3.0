-- =============================================
-- Stored Procedure: users.sp_CheckEmailExists
-- Description: Checks if email already exists
-- Phase: 600 (Stored Procedures)
-- Schema: users
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[users].[sp_CheckEmailExists]'))
    DROP PROCEDURE [users].[sp_CheckEmailExists];
GO

CREATE PROCEDURE [users].[sp_CheckEmailExists]
    @Email NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 1 AS EmailExists FROM users.Users WHERE Email = @Email;
END
GO

