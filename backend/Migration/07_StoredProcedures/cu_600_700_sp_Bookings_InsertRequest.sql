/*
    Migration Script: Create Stored Procedure [bookings].[sp_InsertRequest]
    Description: Creates a new booking request in the unified Bookings table
    
    Execution Order: 700
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [bookings].[sp_InsertRequest]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[bookings].[sp_InsertRequest]'))
    DROP PROCEDURE [bookings].[sp_InsertRequest];
GO

CREATE PROCEDURE [bookings].[sp_InsertRequest]
    @UserID INT,
    @VendorProfileID INT,
    @Services NVARCHAR(MAX),
    @EventDate VARCHAR(10),
    @EventTime VARCHAR(8),
    @EventEndTime VARCHAR(8) = NULL,
    @EventLocation NVARCHAR(500) = NULL,
    @AttendeeCount INT = NULL,
    @Budget DECIMAL(10,2) = NULL,
    @SpecialRequests NVARCHAR(MAX) = NULL,
    @EventName NVARCHAR(255) = NULL,
    @EventType NVARCHAR(100) = NULL,
    @TimeZone NVARCHAR(100) = NULL,
    @Status NVARCHAR(50) = 'pending',
    @ExpiresAt DATETIME = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BookingID INT;
    
    INSERT INTO bookings.Bookings (
        UserID, VendorProfileID, ServiceID,
        BookingDate, EventDate, EventTime, EventEndTime,
        EventLocation, EventName, EventType, TimeZone,
        AttendeeCount, Budget, TotalAmount, Services, SpecialRequests,
        Status, ExpiresAt, CreatedAt, UpdatedAt
    )
    VALUES (
        @UserID, @VendorProfileID, NULL,
        GETDATE(), 
        TRY_CAST(@EventDate AS DATE),
        TRY_CAST(@EventTime AS TIME),
        TRY_CAST(@EventEndTime AS TIME),
        @EventLocation, @EventName, @EventType, @TimeZone,
        @AttendeeCount, @Budget, @Budget, @Services, @SpecialRequests,
        @Status, @ExpiresAt, GETDATE(), GETDATE()
    );
    
    SET @BookingID = SCOPE_IDENTITY();
    
    INSERT INTO bookings.BookingTimeline (BookingID, Status, ChangedBy, Notes, CreatedAt)
    VALUES (@BookingID, 'pending', @UserID, 'Booking request created', GETDATE());
    
    SELECT @BookingID AS RequestID, GETDATE() AS CreatedAt, @ExpiresAt AS ExpiresAt;
END;
GO

PRINT 'Stored procedure [bookings].[sp_InsertRequest] created successfully.';
GO
