/*
    Migration Script: Data - [CategoryQuestions] - Enhanced Questions
    Phase: 1000 - Data
    Script: pb_1000_28_CategoryQuestions.sql
    Description: Inserts comprehensive category-specific questions into [admin].[CategoryQuestions]
    
    Execution Order: 28
    Record Count: 174
    
    Question Types:
    - YesNo: Simple yes/no toggle
    - Select: Single selection dropdown
    - MultiSelect: Multiple selection (comma-separated options)
    - Number: Numeric input
    - Text: Free text input
    
    Categories covered: photo, venue, music, catering, entertainment, experiences, decor, beauty, cake, transport, planner, fashion, stationery
*/

SET NOCOUNT ON;
GO

PRINT 'Updating [admin].[CategoryQuestions] with enhanced questions...';
GO

-- Clear existing questions and re-insert with enhanced data
DELETE FROM [admin].[CategoryQuestions];
GO

SET IDENTITY_INSERT [admin].[CategoryQuestions] ON;
GO

-- =============================================
-- PHOTO / VIDEO CATEGORY (photo)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(1, N'photo', N'What photography styles do you specialize in?', N'MultiSelect', N'Traditional,Photojournalistic,Fine Art,Editorial,Candid,Documentary,Lifestyle,Dramatic,Moody,Light & Airy,Dark & Moody,Film', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(2, N'photo', N'What videography styles do you offer?', N'MultiSelect', N'Cinematic,Documentary,Highlight Reel,Full Coverage,Short Film,Music Video Style,Drone Footage,Same-Day Edit', 0, 2, 1, GETUTCDATE(), GETUTCDATE()),
(3, N'photo', N'Do you offer photography services?', N'YesNo', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(4, N'photo', N'Do you offer videography services?', N'YesNo', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(5, N'photo', N'Do you have drone/aerial capabilities?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(6, N'photo', N'What is your typical turnaround time for edited photos?', N'Select', N'1-2 weeks,2-4 weeks,4-6 weeks,6-8 weeks,8+ weeks', 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(7, N'photo', N'What is your typical turnaround time for edited videos?', N'Select', N'2-4 weeks,4-6 weeks,6-8 weeks,8-12 weeks,12+ weeks', 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(8, N'photo', N'How many edited photos do you typically deliver?', N'Select', N'50-100,100-200,200-400,400-600,600-800,800+,Unlimited', 1, 8, 1, GETUTCDATE(), GETUTCDATE()),
(9, N'photo', N'Do you provide raw/unedited files?', N'YesNo', NULL, 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(10, N'photo', N'What deliverables are included?', N'MultiSelect', N'Online Gallery,USB Drive,Prints,Photo Album,Canvas Prints,Digital Download,Cloud Storage', 1, 10, 1, GETUTCDATE(), GETUTCDATE()),
(11, N'photo', N'Do you offer photo booth services?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(12, N'photo', N'What type of photo booth do you offer?', N'MultiSelect', N'Traditional Enclosed,Open Air,360 Video Booth,Mirror Booth,GIF Booth,Slow Motion,Green Screen,Magazine Cover', 0, 12, 1, GETUTCDATE(), GETUTCDATE()),
(13, N'photo', N'Do you have backup equipment?', N'YesNo', NULL, 1, 13, 1, GETUTCDATE(), GETUTCDATE()),
(14, N'photo', N'Do you offer engagement/pre-wedding shoots?', N'YesNo', NULL, 0, 14, 1, GETUTCDATE(), GETUTCDATE()),
(15, N'photo', N'How many photographers/videographers on your team?', N'Select', N'1,2,3,4,5+', 1, 15, 1, GETUTCDATE(), GETUTCDATE()),
(16, N'photo', N'Do you travel for destination events?', N'YesNo', NULL, 0, 16, 1, GETUTCDATE(), GETUTCDATE()),
(17, N'photo', N'What is your maximum travel distance without additional fees?', N'Select', N'Within city only,Up to 50km,Up to 100km,Up to 200km,Anywhere in province,Nationwide,International', 0, 17, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- VENUES CATEGORY (venue)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(18, N'venue', N'What type of venue space do you offer?', N'MultiSelect', N'Indoor,Outdoor,Covered Outdoor,Rooftop,Garden,Waterfront,Ballroom,Barn/Rustic,Industrial/Loft,Historic,Modern,Restaurant,Hotel,Winery/Vineyard', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(19, N'venue', N'What is your maximum seated capacity?', N'Number', NULL, 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(20, N'venue', N'What is your maximum standing/cocktail capacity?', N'Number', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(21, N'venue', N'What is your minimum guest count requirement?', N'Number', NULL, 0, 4, 1, GETUTCDATE(), GETUTCDATE()),
(22, N'venue', N'What catering options are available?', N'Select', N'In-house catering only,Preferred caterers list,Outside catering allowed,No catering restrictions', 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(23, N'venue', N'Is alcohol service permitted?', N'Select', N'Full bar allowed,Beer and wine only,BYOB allowed,In-house bar only,No alcohol', 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(24, N'venue', N'What is included in the rental?', N'MultiSelect', N'Tables,Chairs,Linens,Tableware,Glassware,Centerpieces,Stage,Dance Floor,AV Equipment,Microphone/PA,Projector/Screen,Lighting,Heating/AC,Parking', 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(25, N'venue', N'Is the venue wheelchair accessible?', N'YesNo', NULL, 1, 8, 1, GETUTCDATE(), GETUTCDATE()),
(26, N'venue', N'Is on-site parking available?', N'YesNo', NULL, 1, 9, 1, GETUTCDATE(), GETUTCDATE()),
(27, N'venue', N'How many parking spaces are available?', N'Select', N'None,1-25,26-50,51-100,100-200,200+,Unlimited', 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(28, N'venue', N'Is valet parking available?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(29, N'venue', N'Are there noise/music restrictions?', N'YesNo', NULL, 1, 12, 1, GETUTCDATE(), GETUTCDATE()),
(30, N'venue', N'What time must music end?', N'Select', N'10:00 PM,11:00 PM,12:00 AM,1:00 AM,2:00 AM,No restriction', 0, 13, 1, GETUTCDATE(), GETUTCDATE()),
(31, N'venue', N'Are there decor restrictions?', N'MultiSelect', N'No open flames,No confetti,No glitter,No tape on walls,No nails/screws,No fog machines,No restrictions', 0, 14, 1, GETUTCDATE(), GETUTCDATE()),
(32, N'venue', N'Is there a bridal suite/getting ready room?', N'YesNo', NULL, 0, 15, 1, GETUTCDATE(), GETUTCDATE()),
(33, N'venue', N'Are overnight accommodations available?', N'YesNo', NULL, 0, 16, 1, GETUTCDATE(), GETUTCDATE()),
(34, N'venue', N'How many rooms are available for overnight guests?', N'Select', N'None,1-5,6-10,11-20,21-50,50+', 0, 17, 1, GETUTCDATE(), GETUTCDATE()),
(35, N'venue', N'Is there a ceremony space on-site?', N'YesNo', NULL, 0, 18, 1, GETUTCDATE(), GETUTCDATE()),
(36, N'venue', N'What is your rental duration?', N'Select', N'4 hours,5 hours,6 hours,8 hours,10 hours,12 hours,Full day,Weekend', 1, 19, 1, GETUTCDATE(), GETUTCDATE()),
(37, N'venue', N'Is setup time included in rental?', N'YesNo', NULL, 1, 20, 1, GETUTCDATE(), GETUTCDATE()),
(38, N'venue', N'Do you have an event coordinator on-site?', N'YesNo', NULL, 0, 21, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- MUSIC / DJ CATEGORY (music)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(39, N'music', N'What type of music services do you offer?', N'MultiSelect', N'DJ,Live Band,Solo Musician,Duo/Trio,String Quartet,Jazz Ensemble,Acoustic,Electronic/EDM,Classical,Cultural/Traditional', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(40, N'music', N'What music genres do you specialize in?', N'MultiSelect', N'Top 40/Pop,R&B/Soul,Hip Hop,Rock,Country,Jazz,Classical,Latin,Bollywood,Arabic,African,Caribbean,Electronic/House,80s/90s,Oldies,Cultural/Traditional', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(41, N'music', N'Do you provide MC/emcee services?', N'YesNo', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(42, N'music', N'What equipment is included?', N'MultiSelect', N'Professional Sound System,Wireless Microphones,Subwoofers,Monitors,Mixer,Backup Equipment,Cables/Stands', 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(43, N'music', N'Do you provide lighting?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(44, N'music', N'What lighting options do you offer?', N'MultiSelect', N'Dance Floor Lighting,Uplighting,Moving Heads,Lasers,Fog/Haze Machine,Disco Ball,String Lights,Monogram/Gobo,Intelligent Lighting', 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(45, N'music', N'Do you take song requests?', N'Select', N'Yes - during event,Yes - in advance only,Limited requests,No requests', 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(46, N'music', N'Do you have a do-not-play list option?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(47, N'music', N'How many hours are included in your standard package?', N'Select', N'3 hours,4 hours,5 hours,6 hours,8 hours,Unlimited', 1, 9, 1, GETUTCDATE(), GETUTCDATE()),
(48, N'music', N'Do you offer ceremony music?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(49, N'music', N'Do you offer cocktail hour music?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(50, N'music', N'Do you have backup equipment on-site?', N'YesNo', NULL, 1, 12, 1, GETUTCDATE(), GETUTCDATE()),
(51, N'music', N'What is your setup time requirement?', N'Select', N'30 minutes,1 hour,1.5 hours,2 hours,2+ hours', 1, 13, 1, GETUTCDATE(), GETUTCDATE()),
(52, N'music', N'Do you require a meal?', N'YesNo', NULL, 0, 14, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- CATERING CATEGORY (catering)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(53, N'catering', N'What service styles do you offer?', N'MultiSelect', N'Buffet,Plated/Seated,Family Style,Food Stations,Cocktail/Passed Appetizers,Food Truck,Drop-off,BBQ/Grill,Live Cooking Stations', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(54, N'catering', N'What cuisine types do you specialize in?', N'MultiSelect', N'American,Italian,French,Mediterranean,Mexican,Chinese,Japanese,Indian,Thai,Middle Eastern,Caribbean,African,Fusion,Farm-to-Table,Seafood,BBQ/Smokehouse,Vegetarian/Vegan', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(55, N'catering', N'What dietary accommodations do you offer?', N'MultiSelect', N'Vegetarian,Vegan,Gluten-Free,Dairy-Free,Nut-Free,Halal,Kosher,Keto,Paleo,Low Sodium,Diabetic-Friendly,Allergen-Friendly', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(56, N'catering', N'What is your minimum guest count?', N'Number', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(57, N'catering', N'What is your maximum guest count?', N'Number', NULL, 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(58, N'catering', N'Do you provide serving staff?', N'YesNo', NULL, 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(59, N'catering', N'What is your staff-to-guest ratio?', N'Select', N'1:10,1:15,1:20,1:25,1:30,Varies by event', 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(60, N'catering', N'Do you provide bartending services?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(61, N'catering', N'What bar services do you offer?', N'MultiSelect', N'Full Bar,Beer and Wine,Signature Cocktails,Non-Alcoholic Bar,Coffee/Espresso Bar,Champagne Toast', 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(62, N'catering', N'Do you provide rentals (plates, linens, etc.)?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(63, N'catering', N'What rentals are available?', N'MultiSelect', N'China/Plates,Flatware,Glassware,Linens,Napkins,Chargers,Serving Pieces,Chafing Dishes', 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(64, N'catering', N'Do you offer tastings?', N'YesNo', NULL, 0, 12, 1, GETUTCDATE(), GETUTCDATE()),
(65, N'catering', N'Is there a tasting fee?', N'Select', N'Free,Complimentary with booking,Fee applies,Fee credited to booking', 0, 13, 1, GETUTCDATE(), GETUTCDATE()),
(66, N'catering', N'Do you handle setup and cleanup?', N'YesNo', NULL, 1, 14, 1, GETUTCDATE(), GETUTCDATE()),
(67, N'catering', N'Do you provide cake cutting service?', N'YesNo', NULL, 0, 15, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- ENTERTAINMENT CATEGORY (entertainment)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(68, N'entertainment', N'What type of entertainment do you provide?', N'MultiSelect', N'Magician,Comedian,Dancers,Acrobats,Fire Performers,Stilt Walkers,Living Statues,Caricature Artist,Face Painter,Balloon Artist,Circus Acts,Cultural Performers,Impersonators,Game Show Host,Trivia Host', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(69, N'entertainment', N'Is your performance suitable for all ages?', N'YesNo', NULL, 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(70, N'entertainment', N'What age groups do you cater to?', N'MultiSelect', N'Children (0-5),Children (6-12),Teens,Adults,Seniors,All Ages', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(71, N'entertainment', N'Can you perform indoors?', N'YesNo', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(72, N'entertainment', N'Can you perform outdoors?', N'YesNo', NULL, 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(73, N'entertainment', N'What is your typical performance duration?', N'Select', N'15-30 minutes,30-45 minutes,45-60 minutes,1-2 hours,2-3 hours,3+ hours,Roaming/Continuous', 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(74, N'entertainment', N'Do you require a stage?', N'YesNo', NULL, 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(75, N'entertainment', N'What space requirements do you have?', N'Select', N'Minimal (5x5 ft),Small (10x10 ft),Medium (15x15 ft),Large (20x20 ft),Very Large (30x30+ ft),Varies', 1, 8, 1, GETUTCDATE(), GETUTCDATE()),
(76, N'entertainment', N'Do you provide your own equipment/props?', N'YesNo', NULL, 1, 9, 1, GETUTCDATE(), GETUTCDATE()),
(77, N'entertainment', N'Do you offer audience participation?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(78, N'entertainment', N'Can you customize your act for themes?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(79, N'entertainment', N'Do you have liability insurance?', N'YesNo', NULL, 1, 12, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- EXPERIENCES & ACTIVITIES CATEGORY (experiences)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(80, N'experiences', N'What type of experiences do you offer?', N'MultiSelect', N'Photo Booth,360 Video Booth,Virtual Reality,Escape Room,Wine/Beer Tasting,Cooking Class,Art Class,Dance Lessons,Team Building,Scavenger Hunt,Trivia,Casino Games,Lawn Games,Arcade Games,Karaoke,Silent Disco', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(81, N'experiences', N'Can this be set up indoors?', N'YesNo', NULL, 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(82, N'experiences', N'Can this be set up outdoors?', N'YesNo', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(83, N'experiences', N'What is the minimum group size?', N'Number', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(84, N'experiences', N'What is the maximum group size?', N'Number', NULL, 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(85, N'experiences', N'Is staff/attendant included?', N'YesNo', NULL, 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(86, N'experiences', N'How many staff members are provided?', N'Select', N'1,2,3,4,5+,Varies by group size', 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(87, N'experiences', N'Can you customize branding/logos?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(88, N'experiences', N'What is your setup time requirement?', N'Select', N'15 minutes,30 minutes,1 hour,1.5 hours,2 hours,2+ hours', 1, 9, 1, GETUTCDATE(), GETUTCDATE()),
(89, N'experiences', N'What space is required?', N'Select', N'10x10 ft,15x15 ft,20x20 ft,30x30 ft,Varies,Full room', 1, 10, 1, GETUTCDATE(), GETUTCDATE()),
(90, N'experiences', N'Do you require power/electricity?', N'YesNo', NULL, 1, 11, 1, GETUTCDATE(), GETUTCDATE()),
(91, N'experiences', N'Is there a weather contingency plan?', N'YesNo', NULL, 0, 12, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- DECOR & RENTALS CATEGORY (decor)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(92, N'decor', N'What decor services do you offer?', N'MultiSelect', N'Floral Design,Centerpieces,Backdrops,Arches/Arbors,Drapery,Balloon Decor,Lighting Design,Table Settings,Signage,Props,Ceiling Installations,Aisle Decor,Ceremony Decor,Reception Decor', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(93, N'decor', N'What rental items do you offer?', N'MultiSelect', N'Tables,Chairs,Linens,Tableware,Glassware,Chargers,Centerpiece Vessels,Candles/Votives,Lanterns,Lounge Furniture,Bars,Tents/Canopies,Dance Floors,Stages,Lighting,Backdrops,Arches,Photo Frames', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(94, N'decor', N'What design styles do you specialize in?', N'MultiSelect', N'Modern/Contemporary,Classic/Traditional,Rustic/Bohemian,Glamorous/Luxe,Minimalist,Romantic,Industrial,Garden/Natural,Cultural/Traditional,Whimsical,Vintage,Tropical', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(95, N'decor', N'Do you offer custom designs?', N'YesNo', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(96, N'decor', N'Is setup included?', N'YesNo', NULL, 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(97, N'decor', N'Is teardown/pickup included?', N'YesNo', NULL, 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(98, N'decor', N'Do you offer delivery?', N'YesNo', NULL, 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(99, N'decor', N'What is your delivery radius?', N'Select', N'Within city,Up to 25km,Up to 50km,Up to 100km,Province-wide,Nationwide', 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(100, N'decor', N'Do you use eco-friendly/sustainable materials?', N'YesNo', NULL, 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(101, N'decor', N'Do you offer day-of coordination for decor?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(102, N'decor', N'Do you provide design consultations?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(103, N'decor', N'Is there a consultation fee?', N'Select', N'Free,Complimentary with booking,Fee applies,Fee credited to booking', 0, 12, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- BEAUTY & WELLNESS CATEGORY (beauty)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(104, N'beauty', N'What beauty services do you offer?', N'MultiSelect', N'Bridal Makeup,Bridal Hair,Bridesmaid Makeup,Bridesmaid Hair,Mother of Bride/Groom,Flower Girl,Groom Grooming,Guest Services,Airbrush Makeup,Traditional Makeup,Henna/Mehndi,Lash Extensions,Nail Services,Spray Tan', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(105, N'beauty', N'What makeup styles do you specialize in?', N'MultiSelect', N'Natural/Soft Glam,Full Glam,Editorial/High Fashion,Vintage/Retro,South Asian/Bollywood,Middle Eastern,African,Airbrush,HD/Camera Ready,Mature Skin,Sensitive Skin', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(106, N'beauty', N'What hair styles do you specialize in?', N'MultiSelect', N'Updos,Half Up/Half Down,Loose Waves/Curls,Braids,Sleek/Straight,Vintage/Retro,Textured Hair,Extensions,Veils/Accessories,Cultural Styles', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(107, N'beauty', N'Do you travel to the client location?', N'YesNo', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(108, N'beauty', N'Do you have a studio location?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(109, N'beauty', N'Do you offer trials?', N'YesNo', NULL, 1, 6, 1, GETUTCDATE(), GETUTCDATE()),
(110, N'beauty', N'Is the trial fee credited to booking?', N'YesNo', NULL, 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(111, N'beauty', N'Do you offer touch-up services during the event?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(112, N'beauty', N'How many clients can you service at once?', N'Select', N'1,2-3,4-5,6-8,8-10,10+', 1, 9, 1, GETUTCDATE(), GETUTCDATE()),
(113, N'beauty', N'Do you use vegan/cruelty-free products?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(114, N'beauty', N'Do you work with sensitive skin/allergies?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(115, N'beauty', N'What brands do you use?', N'Text', NULL, 0, 12, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- CAKE & DESSERTS CATEGORY (cake)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(116, N'cake', N'What cake/dessert types do you offer?', N'MultiSelect', N'Wedding Cake,Birthday Cake,Cupcakes,Cake Pops,Macarons,Cookies,Donuts,Pastries,Dessert Table,Chocolate Fountain,Ice Cream,Cheesecake,Pies,Cultural Desserts', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(117, N'cake', N'What cake styles do you specialize in?', N'MultiSelect', N'Buttercream,Fondant,Naked/Semi-Naked,Drip Cake,Floral,Modern/Geometric,Classic/Traditional,Rustic,Whimsical,Sculpted/3D,Hand-Painted,Metallic/Gold', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(118, N'cake', N'What flavors do you offer?', N'MultiSelect', N'Vanilla,Chocolate,Red Velvet,Lemon,Carrot,Marble,Funfetti,Strawberry,Coconut,Almond,Coffee/Mocha,Champagne,Fruit Flavors,Custom Flavors', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(119, N'cake', N'What dietary options do you offer?', N'MultiSelect', N'Vegan,Gluten-Free,Dairy-Free,Nut-Free,Egg-Free,Sugar-Free,Keto,Halal,Kosher', 0, 4, 1, GETUTCDATE(), GETUTCDATE()),
(120, N'cake', N'Do you offer tastings?', N'YesNo', NULL, 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(121, N'cake', N'Is there a tasting fee?', N'Select', N'Free,Complimentary with booking,Fee applies,Fee credited to booking', 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(122, N'cake', N'Do you provide delivery?', N'YesNo', NULL, 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(123, N'cake', N'Do you provide setup at the venue?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(124, N'cake', N'Is a cake stand included?', N'YesNo', NULL, 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(125, N'cake', N'What is your minimum order?', N'Select', N'No minimum,12 servings,24 servings,50 servings,100 servings', 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(126, N'cake', N'How far in advance should orders be placed?', N'Select', N'1 week,2 weeks,1 month,2 months,3+ months', 1, 11, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- TRANSPORTATION CATEGORY (transport)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(127, N'transport', N'What types of vehicles do you offer?', N'MultiSelect', N'Limousine,Stretch Limo,SUV Limo,Party Bus,Vintage/Classic Car,Luxury Sedan,Rolls Royce,Bentley,Mercedes,BMW,Tesla,Exotic/Sports Car,Horse & Carriage,Trolley,Shuttle Bus,Coach Bus', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(128, N'transport', N'What is the passenger capacity?', N'Select', N'2-4,5-8,9-14,15-20,21-30,31-50,50+', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(129, N'transport', N'Is a chauffeur/driver included?', N'YesNo', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(130, N'transport', N'What is included in the service?', N'MultiSelect', N'Professional Driver,Red Carpet,Champagne/Beverages,Ice/Cooler,Decorations,Music System,TV/Entertainment,WiFi,Privacy Partition,Refreshments', 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(131, N'transport', N'Can the vehicle be decorated?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(132, N'transport', N'Is alcohol allowed in the vehicle?', N'YesNo', NULL, 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(133, N'transport', N'What is your minimum booking duration?', N'Select', N'1 hour,2 hours,3 hours,4 hours,5 hours,No minimum', 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(134, N'transport', N'Do you offer airport transfers?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(135, N'transport', N'Do you offer guest shuttle services?', N'YesNo', NULL, 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(136, N'transport', N'What is your service area?', N'Select', N'City only,Metropolitan area,Province-wide,Multi-province,Nationwide', 1, 10, 1, GETUTCDATE(), GETUTCDATE()),
(137, N'transport', N'Is overtime available?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- PLANNING & COORDINATION CATEGORY (planner)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(138, N'planner', N'What planning services do you offer?', N'MultiSelect', N'Full Planning,Partial Planning,Day-of Coordination,Month-of Coordination,Destination Planning,Elopement Planning,Corporate Event Planning,Social Event Planning,Virtual Event Planning', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(139, N'planner', N'What is included in your full planning service?', N'MultiSelect', N'Venue Selection,Vendor Sourcing,Budget Management,Timeline Creation,Design/Styling,Contract Review,RSVP Management,Seating Charts,Rehearsal Coordination,Day-of Coordination,Guest Management,Vendor Payments', 0, 2, 1, GETUTCDATE(), GETUTCDATE()),
(140, N'planner', N'What event types do you specialize in?', N'MultiSelect', N'Weddings,Corporate Events,Social Events,Galas,Fundraisers,Birthday Parties,Anniversary Parties,Baby Showers,Bridal Showers,Engagement Parties,Holiday Parties,Cultural Events', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(141, N'planner', N'How many events do you take per weekend?', N'Select', N'1,2,3,Varies', 0, 4, 1, GETUTCDATE(), GETUTCDATE()),
(142, N'planner', N'Do you have a preferred vendor list?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(143, N'planner', N'Do you attend vendor meetings with clients?', N'YesNo', NULL, 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(144, N'planner', N'Do you create custom timelines?', N'YesNo', NULL, 1, 7, 1, GETUTCDATE(), GETUTCDATE()),
(145, N'planner', N'Do you handle vendor contracts and payments?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(146, N'planner', N'How many hours of day-of coordination are included?', N'Select', N'6 hours,8 hours,10 hours,12 hours,Unlimited', 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(147, N'planner', N'Do you provide an assistant on event day?', N'YesNo', NULL, 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(148, N'planner', N'Do you offer virtual planning consultations?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- FASHION & ATTIRE CATEGORY (fashion)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(149, N'fashion', N'What fashion items do you offer?', N'MultiSelect', N'Wedding Dresses,Bridesmaid Dresses,Mother of Bride/Groom,Flower Girl Dresses,Suits/Tuxedos,Groomsmen Attire,Cultural/Traditional Wear,Veils,Accessories,Shoes,Jewelry,Alterations', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(150, N'fashion', N'Do you offer rentals?', N'YesNo', NULL, 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(151, N'fashion', N'Do you offer purchases?', N'YesNo', NULL, 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(152, N'fashion', N'Do you offer custom/made-to-measure?', N'YesNo', NULL, 0, 4, 1, GETUTCDATE(), GETUTCDATE()),
(153, N'fashion', N'What size range do you carry?', N'MultiSelect', N'Petite (0-4),Standard (6-14),Plus Size (16-24),Extended Plus (26+),Custom Sizing', 1, 5, 1, GETUTCDATE(), GETUTCDATE()),
(154, N'fashion', N'Are alterations included?', N'YesNo', NULL, 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(155, N'fashion', N'Do you offer in-house alterations?', N'YesNo', NULL, 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(156, N'fashion', N'What is your price range?', N'Select', N'Budget ($0-$500),Moderate ($500-$1500),Premium ($1500-$3000),Luxury ($3000-$5000),Couture ($5000+)', 1, 8, 1, GETUTCDATE(), GETUTCDATE()),
(157, N'fashion', N'Do you offer accessories?', N'MultiSelect', N'Veils,Headpieces,Jewelry,Belts/Sashes,Shoes,Bags/Clutches,Cufflinks,Ties/Bowties,Pocket Squares', 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(158, N'fashion', N'Do you offer appointments?', N'YesNo', NULL, 1, 10, 1, GETUTCDATE(), GETUTCDATE()),
(159, N'fashion', N'Is there an appointment fee?', N'Select', N'Free,Fee applies,Fee credited to purchase', 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(160, N'fashion', N'How far in advance should orders be placed?', N'Select', N'1 month,2 months,3 months,4-6 months,6+ months', 1, 12, 1, GETUTCDATE(), GETUTCDATE());

-- =============================================
-- STATIONERY & INVITATIONS CATEGORY (stationery)
-- =============================================
INSERT [admin].[CategoryQuestions] ([QuestionID], [Category], [QuestionText], [QuestionType], [Options], [IsRequired], [DisplayOrder], [IsActive], [CreatedAt], [UpdatedAt]) VALUES 
(161, N'stationery', N'What stationery items do you offer?', N'MultiSelect', N'Save the Dates,Wedding Invitations,RSVP Cards,Details Cards,Menus,Programs,Place Cards,Table Numbers,Seating Charts,Welcome Signs,Thank You Cards,Envelope Addressing,Custom Monograms', 1, 1, 1, GETUTCDATE(), GETUTCDATE()),
(162, N'stationery', N'What printing methods do you offer?', N'MultiSelect', N'Digital Printing,Letterpress,Foil Stamping,Embossing,Engraving,Thermography,Laser Cut,Watercolor,Calligraphy,Screen Printing', 1, 2, 1, GETUTCDATE(), GETUTCDATE()),
(163, N'stationery', N'What design styles do you specialize in?', N'MultiSelect', N'Modern/Minimalist,Classic/Traditional,Romantic/Floral,Rustic/Bohemian,Art Deco/Vintage,Whimsical,Tropical,Cultural/Traditional,Illustrated,Typography-focused', 1, 3, 1, GETUTCDATE(), GETUTCDATE()),
(164, N'stationery', N'Do you offer custom designs?', N'YesNo', NULL, 1, 4, 1, GETUTCDATE(), GETUTCDATE()),
(165, N'stationery', N'Do you offer semi-custom/template designs?', N'YesNo', NULL, 0, 5, 1, GETUTCDATE(), GETUTCDATE()),
(166, N'stationery', N'Do you offer matching day-of items?', N'YesNo', NULL, 0, 6, 1, GETUTCDATE(), GETUTCDATE()),
(167, N'stationery', N'Do you offer envelope addressing?', N'YesNo', NULL, 0, 7, 1, GETUTCDATE(), GETUTCDATE()),
(168, N'stationery', N'Do you offer calligraphy services?', N'YesNo', NULL, 0, 8, 1, GETUTCDATE(), GETUTCDATE()),
(169, N'stationery', N'Do you use eco-friendly/sustainable materials?', N'YesNo', NULL, 0, 9, 1, GETUTCDATE(), GETUTCDATE()),
(170, N'stationery', N'What is your minimum order quantity?', N'Select', N'No minimum,25,50,75,100,150', 0, 10, 1, GETUTCDATE(), GETUTCDATE()),
(171, N'stationery', N'Do you accept rush orders?', N'YesNo', NULL, 0, 11, 1, GETUTCDATE(), GETUTCDATE()),
(172, N'stationery', N'What is your standard turnaround time?', N'Select', N'1-2 weeks,2-3 weeks,3-4 weeks,4-6 weeks,6-8 weeks', 1, 12, 1, GETUTCDATE(), GETUTCDATE()),
(173, N'stationery', N'Do you ship nationwide?', N'YesNo', NULL, 0, 13, 1, GETUTCDATE(), GETUTCDATE()),
(174, N'stationery', N'Do you offer samples?', N'YesNo', NULL, 0, 14, 1, GETUTCDATE(), GETUTCDATE());

SET IDENTITY_INSERT [admin].[CategoryQuestions] OFF;
GO

PRINT 'Inserted 174 enhanced records into [admin].[CategoryQuestions].';
GO
