-- =============================================
-- Stored Procedure: bookings.sp_CreateRequest
-- Description: Creates a booking request
-- Phase: 600 (Stored Procedures)
-- Schema: bookings
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_CreateRequest]'))
    DROP PROCEDURE [bookings].[sp_CreateRequest];
GO

CREATE PROCEDURE [bookings].[sp_CreateRequest]
    @UserID INT,
    @VendorProfileID INT,
    @Services NVARCHAR(MAX),
    @EventDate DATE,
    @EventTime TIME,
    @EventEndTime TIME = NULL,
    @EventLocation NVARCHAR(500) = NULL,
    @AttendeeCount INT = 50,
    @Budget DECIMAL(10,2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @EventName NVARCHAR(255) = NULL,
    @EventType NVARCHAR(100) = NULL,
    @TimeZone NVARCHAR(100) = NULL,
    @ExpiresAt DATETIME
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO bookings.BookingRequests (
        UserID, VendorProfileID, Services, EventDate, EventTime, EventEndTime, EventLocation, 
        AttendeeCount, Budget, SpecialRequests, EventName, EventType, TimeZone, Status, ExpiresAt, CreatedAt
    )
    OUTPUT INSERTED.RequestID, INSERTED.CreatedAt, INSERTED.ExpiresAt
    VALUES (
        @UserID, @VendorProfileID, @Services, 
        @EventDate, 
        @EventTime,
        @EventEndTime,
        @EventLocation,
        @AttendeeCount, @Budget, @SpecialRequests,
        @EventName, @EventType, @TimeZone,
        'pending', @ExpiresAt, GETDATE()
    );
END
GO

