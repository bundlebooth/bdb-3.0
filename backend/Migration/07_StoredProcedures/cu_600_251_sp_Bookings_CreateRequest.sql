-- =============================================
-- Stored Procedure: sp_Bookings_CreateRequest
-- Description: Creates a booking request
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Bookings_CreateRequest]'))
    DROP PROCEDURE [dbo].[sp_Bookings_CreateRequest];
GO

CREATE PROCEDURE [dbo].[sp_Bookings_CreateRequest]
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
    
    INSERT INTO BookingRequests (
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
