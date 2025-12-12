
-- =====================================================
-- STORED PROCEDURES
-- =====================================================

-- Log security event
CREATE   PROCEDURE sp_LogSecurityEvent
    @UserID INT = NULL,
    @Email NVARCHAR(255) = NULL,
    @Action NVARCHAR(50),
    @ActionStatus NVARCHAR(20) = 'Success',
    @IPAddress NVARCHAR(50) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @Location NVARCHAR(100) = NULL,
    @Device NVARCHAR(100) = NULL,
    @Details NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO SecurityLogs (UserID, Email, Action, ActionStatus, IPAddress, UserAgent, Location, Device, Details)
    VALUES (@UserID, @Email, @Action, @ActionStatus, @IPAddress, @UserAgent, @Location, @Device, @Details);
    
    SELECT SCOPE_IDENTITY() AS LogID;
END;

GO

