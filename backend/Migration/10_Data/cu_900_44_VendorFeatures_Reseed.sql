/*
    Migration Script: Data - [VendorFeatures Reseed]
    Phase: 900 - Data
    Script: cu_900_44_VendorFeatures_Reseed.sql
    Description: Clears and re-seeds VendorFeatureCategories and VendorFeatures tables
    
    Execution Order: 44
    Record Count: 13 categories + 152 features
    
    Note: This script clears existing data and re-inserts. Use when data is missing or corrupted.
*/

SET NOCOUNT ON;

-- First, clear existing data (preserving VendorSelectedFeatures references)
DELETE FROM [dbo].[VendorSelectedFeatures];
DELETE FROM [dbo].[VendorFeatures];
DELETE FROM [dbo].[VendorFeatureCategories];

PRINT 'Cleared existing data...';

-- Insert VendorFeatureCategories
SET IDENTITY_INSERT [dbo].[VendorFeatureCategories] ON;

INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (1, N'Venue Features', N'building-2', 1, 1, GETDATE(), N'venue');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (2, N'Photography & Video', N'camera', 2, 1, GETDATE(), N'photo');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (3, N'Music & Entertainment', N'music', 3, 1, GETDATE(), N'music,entertainment');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (4, N'Catering & Bar', N'utensils', 4, 1, GETDATE(), N'catering,cake');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (5, N'Floral & Decor', N'flower-2', 5, 1, GETDATE(), N'decor');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (6, N'Event Services', N'party-popper', 6, 1, GETDATE(), N'planner,venue');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (7, N'Transportation', N'car', 7, 1, GETDATE(), N'transport');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (8, N'Special Features', N'sparkles', 8, 1, GETDATE(), N'venue,entertainment,experiences,catering');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (9, N'Event Planning', N'clipboard-list', 9, 1, GETDATE(), N'planner');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (10, N'Beauty & Fashion Services', N'sparkles', 10, 1, GETDATE(), N'beauty,fashion');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (11, N'Stationery & Paper Goods', N'file', 11, 1, GETDATE(), N'stationery');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (12, N'Cake & Desserts', N'cake', 12, 1, GETDATE(), N'cake');
INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (13, N'Experience Services', N'sparkles', 13, 1, GETDATE(), N'experiences');

SET IDENTITY_INSERT [dbo].[VendorFeatureCategories] OFF;

PRINT 'Inserted 13 VendorFeatureCategories...';

-- Insert VendorFeatures
SET IDENTITY_INSERT [dbo].[VendorFeatures] ON;

-- Category 1: Venue Features
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (1, 1, N'Indoor Ceremony Space', N'Climate-controlled indoor ceremony area', N'church', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (2, 1, N'Outdoor Ceremony Space', N'Beautiful outdoor ceremony setting', N'trees', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (3, 1, N'On-Site Catering', N'Professional catering services available', N'chef-hat', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (4, 1, N'Wheelchair Accessible', N'Full accessibility for all guests', N'accessibility', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (5, 1, N'Parking Available', N'Convenient on-site parking', N'car-front', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (6, 1, N'Sound System Included', N'Professional audio equipment', N'speaker', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (7, 1, N'WiFi Available', N'Complimentary high-speed internet', N'wifi', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (8, 1, N'Garden/Outdoor Space', N'Scenic outdoor areas for photos', N'trees', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (9, 1, N'Scenic Views', N'Stunning panoramic views', N'eye', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (10, 1, N'Dance Floor', N'Dedicated space for dancing', N'disc', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (11, 1, N'Stage/Platform', N'Elevated stage for performances', N'presentation', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (12, 1, N'Private Dressing Rooms', N'Comfortable preparation areas', N'door-closed', 12, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (13, 1, N'Overnight Accommodations', N'On-site lodging available', N'bed', 13, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (14, 1, N'Airport Shuttle', N'Transportation to/from airport', N'plane', 14, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (15, 1, N'Vendor Preferred List', N'Curated list of trusted vendors', N'users', 15, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (16, 1, N'Exclusive Use', N'Private venue rental', N'camera-off', 16, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (17, 1, N'Power Backup', N'Generator for uninterrupted service', N'zap', 17, 1, GETDATE());

-- Category 2: Photography & Video
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (18, 2, N'Engagement Session', N'Pre-wedding photo session included', N'heart', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (19, 2, N'Second Photographer', N'Additional photographer for coverage', N'camera', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (20, 2, N'Photo Booth', N'Fun interactive photo booth', N'images', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (21, 2, N'Same-Day Edit', N'Quick highlight video on wedding day', N'zap', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (22, 2, N'Drone Footage', N'Aerial photography and video', N'plane', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (23, 2, N'Photo Albums', N'Professional printed albums', N'book-open', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (24, 2, N'Digital Downloads', N'High-resolution digital files', N'file', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (25, 2, N'Online Gallery', N'Private online viewing gallery', N'images', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (26, 2, N'Print Rights', N'Full rights to print photos', N'printer', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (27, 2, N'Cinematic Video', N'Movie-style wedding film', N'film', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (28, 2, N'Live Streaming', N'Stream ceremony to remote guests', N'radio', 11, 1, GETDATE());

-- Category 3: Music & Entertainment
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (29, 3, N'Live Band', N'Professional live music performance', N'guitar', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (30, 3, N'DJ Services', N'Professional DJ and MC', N'disc', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (31, 3, N'Ceremony Music', N'Music for ceremony and processional', N'music', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (32, 3, N'Sound Equipment', N'Professional audio system', N'speaker', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (33, 3, N'Lighting Package', N'Mood and dance floor lighting', N'lightbulb', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (34, 3, N'Microphones', N'Wireless microphones for speeches', N'mic', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (35, 3, N'Music Requests', N'Custom playlist and requests', N'list-music', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (36, 3, N'Cocktail Hour Music', N'Entertainment during cocktail hour', N'glass-water', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (37, 3, N'Karaoke', N'Interactive karaoke setup', N'mic-vocal', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (38, 3, N'String Quartet', N'Classical music ensemble', N'music', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (39, 3, N'Acoustic Guitarist', N'Solo acoustic performance', N'guitar', 11, 1, GETDATE());

-- Category 4: Catering & Bar
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (40, 4, N'Full Bar Service', N'Complete bar with bartenders', N'wine', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (41, 4, N'Signature Cocktails', N'Custom craft cocktails', N'glass-water', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (42, 4, N'Wine Service', N'Curated wine selection', N'wine', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (43, 4, N'Beer Selection', N'Craft and domestic beers', N'beer', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (44, 4, N'Non-Alcoholic Options', N'Mocktails and soft drinks', N'glass-water', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (45, 4, N'Buffet Style', N'Self-service buffet setup', N'utensils', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (46, 4, N'Plated Dinner', N'Formal served dinner', N'utensils-crossed', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (47, 4, N'Family Style', N'Shared platters at tables', N'users', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (48, 4, N'Cocktail Hour Appetizers', N'Passed hors d''oeuvres', N'arrow-right-circle', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (49, 4, N'Dessert Bar', N'Variety of desserts', N'cake', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (50, 4, N'Coffee & Tea Service', N'Hot beverage station', N'coffee', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (51, 4, N'Vegan Options', N'Plant-based menu choices', N'leaf', 12, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (52, 4, N'Gluten-Free Options', N'Gluten-free menu available', N'wheat-off', 13, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (53, 4, N'Kids Menu', N'Special children''s meals', N'baby', 14, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (54, 4, N'Late Night Snacks', N'Evening food service', N'scroll-text', 15, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (55, 4, N'Cake Cutting Service', N'Professional cake service', N'cake', 16, 1, GETDATE());

-- Category 5: Floral & Decor
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (56, 5, N'Bridal Bouquet', N'Custom bridal bouquet', N'flower', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (57, 5, N'Ceremony Flowers', N'Altar and aisle arrangements', N'flower-2', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (58, 5, N'Reception Centerpieces', N'Table centerpiece designs', N'flower', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (59, 5, N'Boutonnieres', N'Flowers for groomsmen', N'flower', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (60, 5, N'Corsages', N'Wrist and pin corsages', N'flower', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (61, 5, N'Arch/Chuppah Decor', N'Ceremony structure florals', N'hexagon', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (62, 5, N'Aisle Decorations', N'Aisle markers and petals', N'rainbow', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (63, 5, N'Sweetheart Table Decor', N'Head table arrangements', N'heart', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (64, 5, N'Uplighting', N'Ambient wall lighting', N'lamp', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (65, 5, N'Draping', N'Fabric ceiling treatments', N'cloud', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (66, 5, N'Linens & Napkins', N'Table linens and napkins', N'layers', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (67, 5, N'Chiavari Chairs', N'Elegant chair rentals', N'armchair', 12, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (68, 5, N'Charger Plates', N'Decorative plate chargers', N'circle', 13, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (69, 5, N'Candles & Votives', N'Ambient candle lighting', N'flame', 14, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (70, 5, N'Signage', N'Welcome and directional signs', N'signpost', 15, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (71, 5, N'Table Numbers', N'Numbered table markers', N'trending-up', 16, 1, GETDATE());

-- Category 6: Event Services
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (72, 6, N'Day-of Coordination', N'Professional event coordination', N'clipboard-check', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (73, 6, N'Full Planning Service', N'Complete wedding planning', N'clipboard-list', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (74, 6, N'Vendor Coordination', N'Liaison with all vendors', N'users-round', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (75, 6, N'Timeline Creation', N'Detailed event timeline', N'calendar-days', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (76, 6, N'Setup & Breakdown', N'Event setup and cleanup', N'hand', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (77, 6, N'Rehearsal Coordination', N'Wedding rehearsal management', N'calendar-check', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (78, 6, N'Guest Services', N'Concierge for guests', N'users', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (79, 6, N'Officiant Services', N'Licensed officiant available', N'handshake', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (80, 6, N'Budget Management', N'Financial planning assistance', N'dollar-sign', 9, 1, GETDATE());

-- Category 7: Transportation
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (81, 7, N'Limousine Service', N'Luxury limo transportation', N'car', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (82, 7, N'Vintage Car Rental', N'Classic car for photos', N'car-front', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (83, 7, N'Guest Shuttle', N'Transportation for guests', N'bus', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (84, 7, N'Valet Parking', N'Professional valet service', N'key-round', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (85, 7, N'Trolley Service', N'Charming trolley transport', N'bus-front', 5, 1, GETDATE());

-- Category 8: Special Features
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (86, 8, N'Sparkler Send-Off', N'Sparklers for grand exit', N'sparkles', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (87, 8, N'Fireworks Display', N'Professional fireworks show', N'flame-kindling', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (88, 8, N'Ice Sculpture', N'Custom ice sculptures', N'flame', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (89, 8, N'Champagne Tower', N'Elegant champagne display', N'wine', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (90, 8, N'Cigar Bar', N'Premium cigar station', N'flame', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (91, 8, N'Kids Entertainment', N'Activities for children', N'gamepad-2', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (92, 8, N'Pet Services', N'Accommodations for pets', N'heart', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (93, 8, N'Cultural Ceremony', N'Traditional ceremony elements', N'drama', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (94, 8, N'Magic/Entertainer', N'Professional entertainment', N'wand', 9, 1, GETDATE());

-- Category 9: Event Planning
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (95, 9, N'Unlimited Meetings', N'Unlimited planning consultations', N'calendar-check', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (96, 9, N'Design Consultation', N'Professional design advice', N'palette', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (97, 9, N'Vendor Recommendations', N'Curated vendor suggestions', N'users', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (98, 9, N'Contract Review', N'Legal contract assistance', N'file', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (99, 9, N'RSVP Management', N'Guest response tracking', N'clipboard-check', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (100, 9, N'Seating Chart', N'Table assignment planning', N'map-pin', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (101, 9, N'Digital Tools Access', N'Online planning platform', N'wifi', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (102, 9, N'Emergency Kit', N'Day-of emergency supplies', N'hand', 8, 1, GETDATE());

-- Category 10: Beauty & Fashion Services
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (103, 10, N'Bridal Hair Styling', N'Professional bridal hair services', N'scissors', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (104, 10, N'Bridal Makeup', N'Full bridal makeup application', N'palette', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (105, 10, N'Bridesmaids Services', N'Hair and makeup for bridesmaids', N'users', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (106, 10, N'Trial Session', N'Pre-wedding trial appointment', N'calendar-check', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (107, 10, N'On-Location Services', N'Travel to venue for services', N'map-pin', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (108, 10, N'Airbrush Makeup', N'Professional airbrush application', N'spray-can', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (109, 10, N'Lash Extensions', N'Individual lash extensions', N'eye', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (110, 10, N'Nail Services', N'Manicure and pedicure', N'hand', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (111, 10, N'Custom Gown Design', N'Bespoke wedding dress design', N'scissors', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (112, 10, N'Alterations Included', N'Complimentary dress alterations', N'move', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (113, 10, N'Accessories', N'Veils, jewelry, and accessories', N'sparkles', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (114, 10, N'Groom Services', N'Grooming services for groom', N'users', 12, 1, GETDATE());

-- Category 11: Stationery & Paper Goods
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (115, 11, N'Save the Dates', N'Custom save the date cards', N'calendar-check', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (116, 11, N'Wedding Invitations', N'Formal invitation suite', N'scroll-text', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (117, 11, N'RSVP Cards', N'Response cards and envelopes', N'clipboard-check', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (118, 11, N'Thank You Cards', N'Post-wedding thank you notes', N'heart', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (119, 11, N'Programs & Menus', N'Ceremony programs and menu cards', N'book-open', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (120, 11, N'Seating Charts', N'Custom seating chart display', N'users', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (121, 11, N'Place Cards', N'Individual guest place cards', N'trending-up', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (122, 11, N'Signage', N'Welcome and directional signs', N'signpost', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (123, 11, N'Envelope Addressing', N'Professional calligraphy', N'scroll-text', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (124, 11, N'Digital Designs', N'Digital invitation files', N'file', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (125, 11, N'Custom Wax Seals', N'Personalized wax seal stamps', N'circle', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (126, 11, N'Day-of Paper Goods', N'Programs, menus, and more', N'layers', 12, 1, GETDATE());

-- Category 12: Cake & Desserts
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (127, 12, N'Multi-Tier Wedding Cake', N'Custom multi-layer cake', N'cake', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (128, 12, N'Cake Tasting', N'Pre-wedding tasting appointment', N'coffee', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (129, 12, N'Custom Design', N'Fully customized cake design', N'palette', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (130, 12, N'Groom''s Cake', N'Separate cake for groom', N'cake', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (131, 12, N'Cupcake Tower', N'Individual cupcake display', N'layers', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (132, 12, N'Dessert Bar', N'Variety of dessert options', N'utensils', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (133, 12, N'Macarons', N'French macaron tower', N'circle', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (134, 12, N'Cake Delivery & Setup', N'Professional delivery and assembly', N'truck', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (135, 12, N'Sugar Flowers', N'Handcrafted sugar flower decorations', N'flower', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (136, 12, N'Fondant Work', N'Custom fondant designs', N'layers', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (137, 12, N'Gluten-Free Options', N'Gluten-free cake available', N'wheat-off', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (138, 12, N'Vegan Options', N'Plant-based cake options', N'leaf', 12, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (139, 12, N'Fresh Fruit Filling', N'Real fruit-filled layers', N'apple', 13, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (140, 12, N'Cake Topper', N'Custom cake topper included', N'crown', 14, 1, GETDATE());

-- Category 13: Experience Services
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (141, 13, N'Photo Booth', N'Interactive photo booth', N'camera', 1, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (142, 13, N'Virtual Reality Experience', N'VR entertainment station', N'gamepad-2', 2, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (143, 13, N'Live Artist/Painter', N'Live event painting', N'palette', 3, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (144, 13, N'Caricature Artist', N'Guest caricature drawings', N'wand', 4, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (145, 13, N'Interactive Games', N'Lawn games and activities', N'gamepad-2', 5, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (146, 13, N'Lounge Setup', N'Comfortable lounge furniture', N'armchair', 6, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (147, 13, N'Cigar Rolling Station', N'Live cigar rolling experience', N'flame', 7, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (148, 13, N'Coffee/Tea Bar', N'Specialty beverage station', N'coffee', 8, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (149, 13, N'S''mores Station', N'DIY s''mores bar', N'flame', 9, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (150, 13, N'Live Calligrapher', N'On-site calligraphy services', N'scroll-text', 10, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (151, 13, N'Fireworks Display', N'Professional fireworks show', N'flame-kindling', 11, 1, GETDATE());
INSERT [dbo].[VendorFeatures] ([FeatureID], [CategoryID], [FeatureName], [FeatureDescription], [FeatureIcon], [DisplayOrder], [IsActive], [CreatedAt]) VALUES (152, 13, N'Sky Lantern Release', N'Coordinated lantern release', N'cloud', 12, 1, GETDATE());

SET IDENTITY_INSERT [dbo].[VendorFeatures] OFF;

PRINT 'Inserted 152 VendorFeatures...';
PRINT 'Done! Vendor features seed data has been applied.';
