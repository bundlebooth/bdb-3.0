-- Section 16: Initial Data Setup

-- Insert default user roles
INSERT INTO UserRoles (RoleName, Description, IsActive)
VALUES 
    ('Admin', 'System administrator with full access', 1),
    ('ServiceProvider', 'Service provider account', 1),
    ('Customer', 'Regular customer account', 1);
GO

-- Insert default booking statuses
INSERT INTO BookingStatuses (StatusName, Description, IsActive)
VALUES 
    ('Pending', 'Booking is pending payment or confirmation', 1),
    ('Confirmed', 'Booking is confirmed and deposit paid', 1),
    ('Completed', 'Booking has been completed', 1),
    ('Cancelled', 'Booking has been cancelled', 1);
GO

-- Insert default provider types
INSERT INTO ProviderTypes (TypeName, Category, IconClass, Description, IsActive, DisplayOrder)
VALUES 
    ('Venue', 'Location', 'fa-building', 'Wedding and event venues', 1, 1),
    ('DJ', 'Entertainment', 'fa-music', 'Disc jockeys and music entertainment', 1, 2),
    ('Photographer', 'Services', 'fa-camera', 'Photography services', 1, 3),
    ('Videographer', 'Services', 'fa-video', 'Videography services', 1, 4),
    ('Caterer', 'Food', 'fa-utensils', 'Catering services', 1, 5),
    ('Florist', 'Decor', 'fa-leaf', 'Floral arrangements', 1, 6),
    ('Baker', 'Food', 'fa-birthday-cake', 'Wedding cakes and desserts', 1, 7),
    ('Planner', 'Services', 'fa-clipboard-list', 'Event planning services', 1, 8),
    ('Officiant', 'Services', 'fa-user-tie', 'Wedding officiants', 1, 9),
    ('Transportation', 'Services', 'fa-car', 'Transportation services', 1, 10);
GO

-- Insert default event types
INSERT INTO EventTypes (TypeName, Description, IconClass, IsActive)
VALUES 
    ('Wedding', 'Wedding ceremony and reception', 'fa-ring', 1),
    ('Corporate', 'Corporate event or meeting', 'fa-briefcase', 1),
    ('Birthday', 'Birthday party', 'fa-birthday-cake', 1),
    ('Anniversary', 'Anniversary celebration', 'fa-glass-cheers', 1),
    ('Graduation', 'Graduation party', 'fa-graduation-cap', 1),
    ('Baby Shower', 'Baby shower', 'fa-baby', 1),
    ('Engagement', 'Engagement party', 'fa-gem', 1),
    ('Holiday', 'Holiday party', 'fa-holly-berry', 1),
    ('Fundraiser', 'Fundraising event', 'fa-hand-holding-usd', 1),
    ('Other', 'Other type of event', 'fa-calendar-alt', 1);
GO

-- Insert default payment methods
INSERT INTO PaymentMethods (MethodName, IsOnline, ProcessingFeePercent, IsActive)
VALUES 
    ('Credit Card', 1, 2.9, 1),
    ('Debit Card', 1, 1.5, 1),
    ('PayPal', 1, 2.5, 1),
    ('Bank Transfer', 1, 0.5, 1),
    ('Check', 0, 0.0, 1),
    ('Cash', 0, 0.0, 1),
    ('Venmo', 1, 1.9, 1),
    ('Apple Pay', 1, 1.5, 1),
    ('Google Pay', 1, 1.5, 1);
GO

-- Insert default review categories for venues
INSERT INTO ReviewCategories (ProviderTypeID, CategoryName, Description, IsActive)
SELECT 
    TypeID,
    CategoryName,
    Description,
    1
FROM (
    VALUES 
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Location', 'Quality and appeal of the location'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Cleanliness', 'Cleanliness of the venue'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Staff', 'Friendliness and helpfulness of staff'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Value', 'Value for the price'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Venue'), 'Amenities', 'Quality of amenities provided'),
        
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Music Selection', 'Variety and quality of music selection'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Equipment', 'Quality of sound equipment'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Professionalism', 'Professionalism of the DJ'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Interaction', 'Interaction with guests'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'DJ'), 'Timing', 'Keeping to schedule and reading the crowd'),
        
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Photo Quality', 'Quality of the photographs'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Professionalism', 'Professionalism of the photographer'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Creativity', 'Creativity in shots and angles'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Delivery Time', 'Timeliness of delivering photos'),
        ((SELECT TypeID FROM ProviderTypes WHERE TypeName = 'Photographer'), 'Personality', 'Comfort level with the photographer')
) AS Categories(ProviderTypeID, CategoryName, Description);
GO

-- Insert default system settings
INSERT INTO SystemSettings (SettingKey, SettingValue, Description, IsPublic)
VALUES 
    ('SiteName', 'EventBookingPlatform', 'Name of the website', 1),
    ('SiteDescription', 'Book venues and services for your events', 'Website description', 1),
    ('DefaultCurrency', 'USD', 'Default currency for pricing', 1),
    ('TaxRate', '0.1', 'Default tax rate (10%)', 1),
    ('DepositPercentage', '0.3', 'Default deposit percentage (30%)', 1),
    ('CancellationPolicy', 'Full refund if cancelled more than 30 days before event. 50% refund if cancelled 7-30 days before. No refund if cancelled less than 7 days before.', 'Cancellation policy text', 1),
    ('MaxImageSizeMB', '5', 'Maximum image upload size in MB', 0),
    ('AllowedImageTypes', 'image/jpeg,image/png', 'Allowed image MIME types', 0),
    ('BookingLeadTimeHours', '24', 'Minimum hours required before a booking', 0),
    ('DefaultPaginationSize', '10', 'Default number of items per page', 0);
GO

