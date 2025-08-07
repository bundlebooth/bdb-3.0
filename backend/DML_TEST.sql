-- =======================================================
-- VENUEVUE SAMPLE DATA (DML SCRIPT)
-- This script inserts a full set of test data for one vendor and one client.
-- Execute this script on a fresh database to test all application features.
-- =======================================================

USE [VenueVueDB]; -- Replace with your database name if different
GO

-- 1. Insert two users: one client and one vendor
-- Note: 'password123' and 'password456' are plain text. Use a hashing function in a real application.
-- The vendor user also has a VendorProfile entry created automatically.

BEGIN TRANSACTION;
BEGIN TRY

    -- Client User
    EXEC sp_RegisterUser 
        @Name = N'Jane Doe', 
        @Email = N'jane.doe@example.com', 
        @PasswordHash = N'$2a$10$S9Y0f6i6l0u9e.8d5cR.lO7b9pC5p7fR4aG6E3m2yV7Z', -- Hashed 'password123'
        @IsVendor = 0,
        @AuthProvider = N'email';
    
    DECLARE @JaneUserID INT = (SELECT UserID FROM Users WHERE Email = 'jane.doe@example.com');

    -- Vendor User (John Smith)
    -- This will also create an empty VendorProfiles entry.
    EXEC sp_RegisterUser 
        @Name = N'John Smith', 
        @Email = N'john.smith@example.com', 
        @PasswordHash = N'$2a$10$T9B8l7j8m1n0f.2a4eG.kL9c8qP7yV6Z4xQ3W1t8V0X', -- Hashed 'password456'
        @IsVendor = 1,
        @AuthProvider = N'email';

    DECLARE @JohnUserID INT = (SELECT UserID FROM Users WHERE Email = 'john.smith@example.com');

    -- 2. Update the vendor's profile with detailed information
    DECLARE @JohnVendorProfileID INT = (SELECT VendorProfileID FROM VendorProfiles WHERE UserID = @JohnUserID);

    -- Step 1: Business Basics
    EXEC sp_UpdateVendorProfileBasics
        @VendorProfileID = @JohnVendorProfileID,
        @BusinessName = N'Epic Events Photography',
        @DisplayName = N'Epic Photo Co.',
        @BusinessEmail = N'info@epiceventsphoto.com',
        @BusinessPhone = N'555-123-4567',
        @Website = N'https://www.epiceventsphoto.com',
        @Categories = N'["photo", "videography"]';

    -- Step 2: Location Info
    EXEC sp_UpdateVendorProfileLocation
        @VendorProfileID = @JohnVendorProfileID,
        @Address = N'123 Main Street',
        @City = N'Los Angeles',
        @State = N'CA',
        @Country = N'USA',
        @PostalCode = N'90210',
        @Latitude = 34.0522,
        @Longitude = -118.2437;
        
    -- Step 3: About the Vendor
    EXEC sp_UpdateVendorProfileAbout
        @VendorProfileID = @JohnVendorProfileID,
        @Tagline = N'Capturing your most epic moments.',
        @BusinessDescription = N'We are a team of passionate photographers and videographers dedicated to telling the unique story of your event. From weddings to corporate gatherings, we ensure every detail is captured with artistry and precision.',
        @YearsInBusiness = 10;

    -- Update the vendor profile to be verified and completed
    UPDATE VendorProfiles SET IsVerified = 1, IsCompleted = 1 WHERE VendorProfileID = @JohnVendorProfileID;

    -- 3. Add Vendor Images and Portfolio
    INSERT INTO VendorImages (VendorProfileID, ImageURL, IsPrimary, Caption) VALUES
    (@JohnVendorProfileID, N'https://placehold.co/800x600/5e72e4/ffffff?text=Primary', 1, N'Our primary featured image.'),
    (@JohnVendorProfileID, N'https://placehold.co/800x600/f7fafc/2d3748?text=Gallery+Image+1', 0, N'A beautiful wedding shot.');

    INSERT INTO VendorPortfolio (VendorProfileID, Title, Description, ImageURL) VALUES
    (@JohnVendorProfileID, N'Sunset Wedding', N'A stunning wedding captured at sunset.', N'https://placehold.co/1000x800/d1fae5/065f46?text=Portfolio+Shot+1');

    -- 4. Add Services
    DECLARE @PhotoCategoryID INT;
    INSERT INTO ServiceCategories (VendorProfileID, Name) VALUES (@JohnVendorProfileID, N'Photography Packages');
    SET @PhotoCategoryID = SCOPE_IDENTITY();

    INSERT INTO Services (CategoryID, Name, Description, Price, DurationMinutes, RequiresDeposit, DepositPercentage) VALUES
    (@PhotoCategoryID, N'Standard Photo Package', N'4 hours of professional photography with digital gallery.', 1500.00, 240, 1, 25.00),
    (@PhotoCategoryID, N'Full Day Package', N'8 hours of photography and videography, including a highlight reel.', 3500.00, 480, 1, 20.00);

    -- 5. Create a Booking
    DECLARE @StandardPackageID INT = (SELECT TOP 1 ServiceID FROM Services WHERE CategoryID = @PhotoCategoryID AND Name LIKE '%Standard%');
    DECLARE @BookingID INT;

    EXEC sp_CreateBooking
        @UserID = @JaneUserID,
        @ServiceID = @StandardPackageID,
        @EventDate = '2025-08-20 14:00:00',
        @EndDate = '2025-08-20 18:00:00',
        @AttendeeCount = 50,
        @SpecialRequests = 'Please focus on capturing the toasts and dance floor.';

    SET @BookingID = (SELECT TOP 1 BookingID FROM Bookings WHERE UserID = @JaneUserID ORDER BY CreatedAt DESC);

    -- 6. Add a Review for the Booking
    EXEC sp_AddReview
        @UserID = @JaneUserID,
        @VendorProfileID = @JohnVendorProfileID,
        @BookingID = @BookingID,
        @Rating = 5,
        @Title = N'Absolutely fantastic!',
        @Comment = N'John and his team were amazing. They captured every special moment beautifully. Highly recommend!',
        @IsAnonymous = 0;

    -- 7. Create a conversation
    DECLARE @ConversationID INT;
    EXEC sp_CreateConversation 
        @UserID = @JaneUserID,
        @VendorProfileID = @JohnVendorProfileID,
        @BookingID = @BookingID,
        @Subject = N'Question about booking';
    
    SET @ConversationID = (SELECT TOP 1 ConversationID FROM Conversations WHERE UserID = @JaneUserID AND VendorProfileID = @JohnVendorProfileID);

    -- Add messages
    EXEC sp_SendMessage
        @ConversationID = @ConversationID,
        @SenderID = @JaneUserID,
        @Content = N'Hi John, just confirming the details for our booking on August 20th.';
    
    EXEC sp_SendMessage
        @ConversationID = @ConversationID,
        @SenderID = @JohnUserID,
        @Content = N'Hi Jane, yes, I have you booked in. We look forward to it!';

    -- 8. Add a Favorite
    INSERT INTO Favorites (UserID, VendorProfileID) VALUES (@JaneUserID, @JohnVendorProfileID);

    -- 9. Add a notification
    INSERT INTO Notifications (UserID, Type, Title, Message, RelatedID, RelatedType, ActionURL) VALUES
    (@JaneUserID, N'booking', N'Booking Status Update', N'Your booking with Epic Events Photography has been confirmed!', @BookingID, N'booking', N'/bookings/' + CAST(@BookingID AS NVARCHAR(10)));
    
COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO

PRINT 'Sample data inserted successfully!';
