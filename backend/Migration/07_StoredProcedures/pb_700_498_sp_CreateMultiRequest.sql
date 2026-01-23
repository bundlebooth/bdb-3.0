/*
    Migration Script: Create Stored Procedure [bookings].[sp_CreateMultiRequest]
    Description: Creates the [bookings].[sp_CreateMultiRequest] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CreateMultiRequest]'))
    DROP PROCEDURE [bookings].[sp_CreateMultiRequest];
GO


CREATE PROCEDURE [bookings].[sp_CreateMultiRequest]
    @UserID INT,
    @VendorProfileID INT,
    @GroupID NVARCHAR(100),
    @Services NVARCHAR(MAX) = NULL,
    @EventDate DATE,
    @EventTime TIME = NULL,
    @EventEndTime TIME = NULL,
    @EventLocation NVARCHAR(500) = NULL,
    @AttendeeCount INT = NULL,
    @Budget DECIMAL(10,2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @EventName NVARCHAR(255) = NULL,
    @EventType NVARCHAR(100) = NULL,
    @TimeZone NVARCHAR(100) = NULL,
    @ExpiresAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @BookingID INT;
    
    INSERT INTO bookings.Bookings (UserID, VendorProfileID, GroupID, BookingDate, EventDate, EventTime, EventEndTime, EventLocation, AttendeeCount, Budget, TotalAmount, Services, SpecialRequests, EventName, EventType, TimeZone, Status, ExpiresAt, CreatedAt, UpdatedAt)
    VALUES (@UserID, @VendorProfileID, @GroupID, GETDATE(), @EventDate, @EventTime, @EventEndTime, @EventLocation, @AttendeeCount, @Budget, @Budget, @Services, @SpecialRequests, @EventName, @EventType, @TimeZone, 'pending', @ExpiresAt, GETDATE(), GETDATE());
    
    SET @BookingID = SCOPE_IDENTITY();
    SELECT @BookingID AS RequestID, GETDATE() AS CreatedAt, @ExpiresAt AS ExpiresAt;
END;
GO
