/*
    Migration Script: Seed Data for [Subcategories]
    Phase: 1000 - Data
    Script: pb_1000_10_Subcategories.sql
    Description: Inserts initial subcategory data for each vendor category
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting seed data for [admin].[Subcategories]...';
GO

-- Only insert if table is empty
IF NOT EXISTS (SELECT 1 FROM [admin].[Subcategories])
BEGIN
    -- Photo/Video subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Photo/Video', 'photo-booth', 'Photo Booth', 'Traditional photo booth services', 1, 1),
        ('Photo/Video', '360-video-booth', '360 Video Booth', '360-degree video capture booth', 2, 1),
        ('Photo/Video', 'magazine-booth', 'Magazine Booth', 'Magazine-style photo booth', 3, 1),
        ('Photo/Video', 'wedding-photography', 'Wedding Photography', 'Professional wedding photography', 4, 1),
        ('Photo/Video', 'event-photography', 'Event Photography', 'General event photography', 5, 1),
        ('Photo/Video', 'videography', 'Videography', 'Video recording and production', 6, 1),
        ('Photo/Video', 'drone-photography', 'Drone Photography', 'Aerial photography and video', 7, 1);

    -- Catering subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Catering', 'full-service', 'Full Service Catering', 'Complete catering with staff', 1, 1),
        ('Catering', 'drop-off', 'Drop-Off Catering', 'Food delivery without service staff', 2, 1),
        ('Catering', 'food-truck', 'Food Truck', 'Mobile food service', 3, 1),
        ('Catering', 'desserts', 'Desserts & Sweets', 'Specialty desserts and sweets', 4, 1),
        ('Catering', 'beverages', 'Beverage Service', 'Bar and beverage catering', 5, 1),
        ('Catering', 'bbq', 'BBQ Catering', 'Barbecue and grilling services', 6, 1);

    -- Music/DJ subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Music/DJ', 'wedding-dj', 'Wedding DJ', 'DJ services for weddings', 1, 1),
        ('Music/DJ', 'event-dj', 'Event DJ', 'DJ for corporate and private events', 2, 1),
        ('Music/DJ', 'live-band', 'Live Band', 'Live music performance', 3, 1),
        ('Music/DJ', 'solo-musician', 'Solo Musician', 'Individual performer', 4, 1),
        ('Music/DJ', 'string-quartet', 'String Quartet', 'Classical string ensemble', 5, 1),
        ('Music/DJ', 'jazz-band', 'Jazz Band', 'Jazz music ensemble', 6, 1);

    -- Entertainment subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Entertainment', 'magician', 'Magician', 'Magic and illusion performances', 1, 1),
        ('Entertainment', 'comedian', 'Comedian', 'Stand-up comedy and MC services', 2, 1),
        ('Entertainment', 'dancers', 'Dancers', 'Dance performances and entertainment', 3, 1),
        ('Entertainment', 'face-painting', 'Face Painting', 'Face painting for events', 4, 1),
        ('Entertainment', 'balloon-artist', 'Balloon Artist', 'Balloon twisting and decorations', 5, 1),
        ('Entertainment', 'caricature-artist', 'Caricature Artist', 'Live caricature drawings', 6, 1),
        ('Entertainment', 'fire-performer', 'Fire Performer', 'Fire dancing and performances', 7, 1);

    -- Venues subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Venues', 'banquet-hall', 'Banquet Hall', 'Large indoor event space', 1, 1),
        ('Venues', 'outdoor-venue', 'Outdoor Venue', 'Gardens, patios, and outdoor spaces', 2, 1),
        ('Venues', 'rooftop', 'Rooftop', 'Rooftop event spaces', 3, 1),
        ('Venues', 'restaurant', 'Restaurant', 'Restaurant private dining', 4, 1),
        ('Venues', 'hotel', 'Hotel', 'Hotel event spaces', 5, 1),
        ('Venues', 'winery', 'Winery/Vineyard', 'Winery and vineyard venues', 6, 1),
        ('Venues', 'barn', 'Barn/Rustic', 'Rustic barn venues', 7, 1);

    -- Decorations subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Decorations', 'floral', 'Floral Design', 'Flower arrangements and floral decor', 1, 1),
        ('Decorations', 'furniture-rental', 'Furniture Rental', 'Tables, chairs, and furniture', 2, 1),
        ('Decorations', 'tent-rental', 'Tent Rental', 'Tents and canopy rentals', 3, 1),
        ('Decorations', 'lighting', 'Lighting', 'Event lighting and effects', 4, 1),
        ('Decorations', 'linens', 'Linens & Tableware', 'Table linens and dishware', 5, 1),
        ('Decorations', 'backdrops', 'Backdrops & Props', 'Photo backdrops and event props', 6, 1);

    -- Beauty subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Beauty', 'hair-styling', 'Hair Styling', 'Professional hair styling', 1, 1),
        ('Beauty', 'makeup', 'Makeup Artist', 'Professional makeup services', 2, 1),
        ('Beauty', 'spa-services', 'Spa Services', 'Mobile spa and wellness', 3, 1),
        ('Beauty', 'henna', 'Henna Artist', 'Henna and mehndi art', 4, 1),
        ('Beauty', 'nail-services', 'Nail Services', 'Manicure and pedicure', 5, 1);

    -- Planners subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Planners', 'full-planning', 'Full Event Planning', 'Complete event planning services', 1, 1),
        ('Planners', 'day-of-coordination', 'Day-of Coordination', 'Event day management', 2, 1),
        ('Planners', 'partial-planning', 'Partial Planning', 'Selective planning assistance', 3, 1),
        ('Planners', 'destination-planning', 'Destination Planning', 'Destination event planning', 4, 1);

    -- Transportation subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Transportation', 'limousine', 'Limousine', 'Luxury limousine service', 1, 1),
        ('Transportation', 'party-bus', 'Party Bus', 'Party bus rentals', 2, 1),
        ('Transportation', 'vintage-car', 'Vintage Car', 'Classic and vintage vehicles', 3, 1),
        ('Transportation', 'shuttle', 'Shuttle Service', 'Guest transportation shuttles', 4, 1),
        ('Transportation', 'horse-carriage', 'Horse & Carriage', 'Horse-drawn carriage service', 5, 1);

    -- Officiants & Ceremony subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Officiants & Ceremony', 'wedding-officiant', 'Wedding Officiant', 'Licensed wedding officiant', 1, 1),
        ('Officiants & Ceremony', 'religious-officiant', 'Religious Officiant', 'Religious ceremony officiant', 2, 1),
        ('Officiants & Ceremony', 'non-denominational', 'Non-Denominational', 'Secular ceremony officiant', 3, 1);

    -- Cake subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Cake', 'wedding-cake', 'Wedding Cake', 'Custom wedding cakes', 1, 1),
        ('Cake', 'birthday-cake', 'Birthday Cake', 'Birthday and celebration cakes', 2, 1),
        ('Cake', 'cupcakes', 'Cupcakes', 'Cupcakes and mini desserts', 3, 1),
        ('Cake', 'dessert-table', 'Dessert Table', 'Full dessert table setup', 4, 1),
        ('Cake', 'specialty-desserts', 'Specialty Desserts', 'Macarons, pastries, and specialty items', 5, 1),
        ('Cake', 'chocolate-fountain', 'Chocolate Fountain', 'Chocolate fountain service', 6, 1);

    -- Fashion subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Fashion', 'bridal-gowns', 'Bridal Gowns', 'Wedding dresses and bridal wear', 1, 1),
        ('Fashion', 'groom-attire', 'Groom Attire', 'Suits, tuxedos, and groom wear', 2, 1),
        ('Fashion', 'bridesmaid-dresses', 'Bridesmaid Dresses', 'Bridesmaid and party dresses', 3, 1),
        ('Fashion', 'cultural-attire', 'Cultural Attire', 'Traditional and cultural wedding wear', 4, 1),
        ('Fashion', 'accessories', 'Accessories', 'Jewelry, veils, and accessories', 5, 1),
        ('Fashion', 'alterations', 'Alterations', 'Tailoring and alterations services', 6, 1);

    -- Stationery subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Stationery', 'wedding-invitations', 'Wedding Invitations', 'Custom wedding invitations', 1, 1),
        ('Stationery', 'save-the-dates', 'Save the Dates', 'Save the date cards', 2, 1),
        ('Stationery', 'programs-menus', 'Programs & Menus', 'Ceremony programs and menus', 3, 1),
        ('Stationery', 'signage', 'Signage', 'Event signage and welcome boards', 4, 1),
        ('Stationery', 'calligraphy', 'Calligraphy', 'Hand calligraphy services', 5, 1),
        ('Stationery', 'thank-you-cards', 'Thank You Cards', 'Thank you and follow-up cards', 6, 1);

    -- Experiences subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Experiences', 'photo-booth-experience', 'Photo Booth Experience', 'Interactive photo booth setups', 1, 1),
        ('Experiences', 'games-activities', 'Games & Activities', 'Interactive games and activities', 2, 1),
        ('Experiences', 'wine-tasting', 'Wine Tasting', 'Wine tasting experiences', 3, 1),
        ('Experiences', 'cooking-class', 'Cooking Class', 'Group cooking experiences', 4, 1),
        ('Experiences', 'team-building', 'Team Building', 'Corporate team building activities', 5, 1),
        ('Experiences', 'virtual-experiences', 'Virtual Experiences', 'Online and virtual event activities', 6, 1);

    -- Jewellery & Accessories subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Jewellery & Accessories', 'engagement-rings', 'Engagement Rings', 'Engagement and wedding rings', 1, 1),
        ('Jewellery & Accessories', 'wedding-bands', 'Wedding Bands', 'Wedding bands and sets', 2, 1),
        ('Jewellery & Accessories', 'bridal-jewelry', 'Bridal Jewelry', 'Necklaces, earrings, and bridal sets', 3, 1),
        ('Jewellery & Accessories', 'custom-jewelry', 'Custom Jewelry', 'Custom designed jewelry', 4, 1);

    -- Favours & Gifts subcategories
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Favours & Gifts', 'edible-favours', 'Edible Favours', 'Chocolates, cookies, and edible gifts', 1, 1),
        ('Favours & Gifts', 'personalized-gifts', 'Personalized Gifts', 'Custom engraved and personalized items', 2, 1),
        ('Favours & Gifts', 'gift-baskets', 'Gift Baskets', 'Curated gift baskets', 3, 1),
        ('Favours & Gifts', 'welcome-bags', 'Welcome Bags', 'Guest welcome bags and amenities', 4, 1);

    PRINT 'Subcategories seed data inserted successfully.';
END
ELSE
BEGIN
    PRINT 'Subcategories table already has data. Skipping seed.';
END
GO

-- =============================================
-- UPDATE: Convert old category names to new format (2026-02-13)
-- This ensures subcategories work with the new snake_case category system
-- =============================================
PRINT 'Updating subcategory categories to new format...';

-- Photo/Video -> Photography (for photo category)
UPDATE [admin].[Subcategories] SET Category = 'Photography' WHERE Category = 'Photo/Video';

-- Add Videography subcategories (split from Photo/Video)
IF NOT EXISTS (SELECT 1 FROM [admin].[Subcategories] WHERE Category = 'Videography')
BEGIN
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('Videography', 'wedding-videography', 'Wedding Videography', 'Professional wedding video coverage', 1, 1),
        ('Videography', 'event-videography', 'Event Videography', 'Corporate and event video coverage', 2, 1),
        ('Videography', 'highlight-reel', 'Highlight Reel', 'Short highlight video editing', 3, 1),
        ('Videography', 'drone-videography', 'Drone Videography', 'Aerial drone video capture', 4, 1),
        ('Videography', 'live-streaming', 'Live Streaming', 'Live event streaming services', 5, 1),
        ('Videography', 'cinematic-film', 'Cinematic Film', 'Cinematic style video production', 6, 1);
    PRINT '  Added Videography subcategories';
END

-- Music/DJ -> Music (for music category)
UPDATE [admin].[Subcategories] SET Category = 'Music' WHERE Category = 'Music/DJ';

-- Add DJ subcategories (split from Music/DJ)
IF NOT EXISTS (SELECT 1 FROM [admin].[Subcategories] WHERE Category = 'DJ')
BEGIN
    INSERT INTO [admin].[Subcategories] (Category, SubcategoryKey, SubcategoryName, Description, DisplayOrder, IsActive)
    VALUES 
        ('DJ', 'wedding-dj', 'Wedding DJ', 'DJ services for weddings', 1, 1),
        ('DJ', 'event-dj', 'Event DJ', 'DJ for corporate and private events', 2, 1),
        ('DJ', 'club-dj', 'Club DJ', 'Nightclub and party DJ', 3, 1),
        ('DJ', 'mc-services', 'MC Services', 'Master of ceremonies and hosting', 4, 1),
        ('DJ', 'karaoke-dj', 'Karaoke DJ', 'Karaoke hosting and equipment', 5, 1);
    PRINT '  Added DJ subcategories';
END

-- Officiants & Ceremony -> Officiants
UPDATE [admin].[Subcategories] SET Category = 'Officiants' WHERE Category = 'Officiants & Ceremony';

-- Jewellery & Accessories -> Jewelry
UPDATE [admin].[Subcategories] SET Category = 'Jewelry' WHERE Category = 'Jewellery & Accessories';

-- Favours & Gifts -> Favors
UPDATE [admin].[Subcategories] SET Category = 'Favors' WHERE Category = 'Favours & Gifts';

PRINT 'Subcategory categories updated to new format.';
GO
