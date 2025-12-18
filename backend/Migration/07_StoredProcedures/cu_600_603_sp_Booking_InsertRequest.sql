-- =============================================
-- Stored Procedure: sp_Booking_InsertRequest
-- Description: Inserts a new booking request
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Booking_InsertRequest]'))
    DROP PROCEDURE [dbo].[sp_Booking_InsertRequest];
GO

CREATE PROCEDURE [dbo].[sp_Booking_InsertRequest]
    @UserID INT,
    @VendorProfileID INT,
    @Services NVARCHAR(MAX),
    @EventDate VARCHAR(10),
    @EventTime VARCHAR(8),
    @EventEndTime VARCHAR(8),
    @EventLocation NVARCHAR(500),
    @AttendeeCount INT,
    @Budget DECIMAL(10,2),
    @SpecialRequests NVARCHAR(MAX),
    @EventName NVARCHAR(255),
    @EventType NVARCHAR(100),
    @TimeZone NVARCHAR(100),
    @Status NVARCHAR(50),
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
        TRY_CONVERT(DATE, @EventDate), 
        TRY_CONVERT(TIME, @EventTime),
        TRY_CONVERT(TIME, @EventEndTime),
        @EventLocation,
        @AttendeeCount, @Budget, @SpecialRequests,
        @EventName, @EventType, @TimeZone,
        @Status, @ExpiresAt, GETDATE()
    );
END
GO
