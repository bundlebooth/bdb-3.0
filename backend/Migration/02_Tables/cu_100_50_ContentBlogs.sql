-- Create content schema if not exists
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = 'content')
BEGIN
    EXEC('CREATE SCHEMA content');
END
GO

-- Create Blogs table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'content.Blogs') AND type in (N'U'))
BEGIN
    CREATE TABLE content.Blogs (
        BlogID INT IDENTITY(1,1) PRIMARY KEY,
        Title NVARCHAR(255) NOT NULL,
        Slug NVARCHAR(255) NOT NULL UNIQUE,
        Excerpt NVARCHAR(500) NULL,
        Content NVARCHAR(MAX) NOT NULL,
        FeaturedImageURL NVARCHAR(500) NULL,
        Category NVARCHAR(100) DEFAULT 'General',
        Tags NVARCHAR(500) NULL,
        Author NVARCHAR(100) DEFAULT 'PlanBeau Team',
        AuthorImageURL NVARCHAR(500) NULL,
        Status NVARCHAR(50) DEFAULT 'draft', -- draft, published, archived
        IsFeatured BIT DEFAULT 0,
        ViewCount INT DEFAULT 0,
        PublishedAt DATETIME2 NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
    );

    -- Create indexes
    CREATE INDEX IX_Blogs_Status ON content.Blogs(Status);
    CREATE INDEX IX_Blogs_Category ON content.Blogs(Category);
    CREATE INDEX IX_Blogs_PublishedAt ON content.Blogs(PublishedAt DESC);
    CREATE INDEX IX_Blogs_IsFeatured ON content.Blogs(IsFeatured);
END
GO

-- Insert sample blog posts
IF NOT EXISTS (SELECT 1 FROM content.Blogs)
BEGIN
    INSERT INTO content.Blogs (Title, Slug, Excerpt, Content, FeaturedImageURL, Category, Tags, Author, Status, IsFeatured, PublishedAt)
    VALUES 
    (
        'What to Serve Your Guests at a Christmas Afternoon Tea',
        'christmas-afternoon-tea-guide',
        'Planning a festive afternoon tea? Discover the perfect menu ideas and tips for hosting an unforgettable Christmas gathering.',
        '<h2>The Perfect Christmas Tea Menu</h2><p>Hosting an afternoon tea during the holiday season is a wonderful way to celebrate with friends and family. Here are our top recommendations for creating a memorable Christmas tea experience.</p><h3>Savory Selections</h3><p>Start with classic finger sandwiches featuring seasonal flavors like smoked salmon with dill cream cheese, turkey with cranberry, and brie with fig jam.</p><h3>Sweet Treats</h3><p>No afternoon tea is complete without scones! Serve warm cranberry orange scones with clotted cream and festive jams. Add miniature mince pies, gingerbread cookies, and a stunning yule log cake.</p><h3>The Perfect Brew</h3><p>Offer a selection of teas including a spiced chai, classic Earl Grey, and a festive cinnamon apple blend.</p>',
        'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800',
        'Holiday Festivities',
        'christmas,afternoon tea,hosting,events',
        'PlanBeau Team',
        'published',
        1,
        GETDATE()
    ),
    (
        '10 Wedding Planning Tips Every Couple Should Know',
        'wedding-planning-tips-for-couples',
        'From setting your budget to choosing the perfect venue, these essential tips will help make your wedding planning journey smoother.',
        '<h2>Essential Wedding Planning Tips</h2><p>Planning a wedding can feel overwhelming, but with the right approach, it can also be an exciting journey. Here are our top 10 tips for couples.</p><h3>1. Set Your Budget Early</h3><p>Before you start dreaming about venues and flowers, sit down together and establish a realistic budget.</p><h3>2. Prioritize What Matters Most</h3><p>Decide what elements of your wedding are most important to you both and allocate your budget accordingly.</p><h3>3. Book Your Venue First</h3><p>Your venue sets the tone for everything else, so secure it early to get your preferred date.</p>',
        'https://images.unsplash.com/photo-1519741497674-611481863552?w=800',
        'Wedding Planning',
        'wedding,planning,tips,couples',
        'PlanBeau Team',
        'published',
        1,
        DATEADD(day, -3, GETDATE())
    ),
    (
        'How to Choose the Right Photographer for Your Event',
        'choosing-event-photographer',
        'Finding the perfect photographer can make or break your event memories. Learn what to look for and questions to ask.',
        '<h2>Finding Your Perfect Event Photographer</h2><p>Your event photos will be treasured for years to come. Here''s how to find the right photographer for your special occasion.</p><h3>Review Their Portfolio</h3><p>Look for consistency in style and quality. Make sure their aesthetic matches your vision.</p><h3>Ask About Experience</h3><p>Inquire about their experience with similar events and venues.</p><h3>Discuss Your Vision</h3><p>A great photographer will listen to your ideas and offer creative suggestions.</p>',
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800',
        'Event Tips',
        'photography,events,tips,vendors',
        'PlanBeau Team',
        'published',
        0,
        DATEADD(day, -7, GETDATE())
    ),
    (
        'Corporate Event Planning: A Complete Guide',
        'corporate-event-planning-guide',
        'From team building activities to annual galas, learn how to plan successful corporate events that leave lasting impressions.',
        '<h2>Mastering Corporate Event Planning</h2><p>Corporate events require careful planning and attention to detail. Whether you''re organizing a small team meeting or a large conference, these tips will help ensure success.</p><h3>Define Your Objectives</h3><p>What do you want to achieve? Clear goals will guide all your planning decisions.</p><h3>Know Your Audience</h3><p>Understanding your attendees helps you create an engaging experience.</p><h3>Choose the Right Venue</h3><p>Consider accessibility, capacity, and available amenities.</p>',
        'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
        'Business Events',
        'corporate,business,events,planning',
        'PlanBeau Team',
        'published',
        0,
        DATEADD(day, -10, GETDATE())
    ),
    (
        'Spotlight: Top Wedding Vendors in Toronto',
        'top-wedding-vendors-toronto',
        'Discover the most sought-after wedding vendors in Toronto, from florists to caterers, who can make your dream wedding a reality.',
        '<h2>Toronto''s Best Wedding Vendors</h2><p>Toronto is home to some of Canada''s most talented wedding professionals. Here are our top picks across various categories.</p><h3>Florists</h3><p>From romantic garden arrangements to modern minimalist designs, Toronto florists offer diverse styles.</p><h3>Caterers</h3><p>Whether you want a formal sit-down dinner or trendy food stations, the city has options for every taste.</p><h3>Photographers</h3><p>Capture your special day with award-winning photographers who specialize in wedding storytelling.</p>',
        'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=800',
        'Vendor Spotlights',
        'vendors,toronto,wedding,spotlight',
        'PlanBeau Team',
        'published',
        1,
        DATEADD(day, -5, GETDATE())
    );
END
GO
