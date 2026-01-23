/*
    Migration Script: Data - [Articles]
    Phase: 900 - Data
    Script: cu_900_52_admin.Articles.sql
    Description: Inserts articles about Planbeau platform, vendor guides, and client resources
    
    Execution Order: 52
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [admin].[Articles]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [admin].[Articles])
BEGIN
    SET IDENTITY_INSERT [admin].[Articles] ON;

    INSERT [admin].[Articles] ([ArticleID], [Title], [Slug], [Summary], [Content], [CategoryID], [ArticleType], [Author], [Tags], [DisplayOrder], [IsActive], [IsFeatured], [PublishedAt]) VALUES 
    -- PLATFORM ARTICLES
    (1, N'Welcome to Planbeau: The Future of Event Services', N'welcome-to-planbeau', 
    N'Discover how Planbeau is revolutionizing the way clients connect with talented event vendors.',
    N'<h2>Welcome to Planbeau</h2>
<p>Planbeau is more than just a marketplace—it''s a community of passionate professionals and clients coming together to create unforgettable experiences. Whether you''re planning a wedding, corporate event, birthday celebration, or any special occasion, we''re here to help you find the perfect vendors.</p>

<h3>Our Mission</h3>
<p>We believe everyone deserves access to talented, reliable service providers. Our platform makes it easy to discover, compare, and book vendors with confidence. With verified reviews, secure payments, and dedicated support, you can focus on what matters most—enjoying your event.</p>

<h3>What Makes Us Different</h3>
<ul>
<li><strong>Curated Vendors:</strong> Every vendor on our platform is verified and vetted for quality.</li>
<li><strong>Transparent Pricing:</strong> See clear pricing upfront with no hidden fees.</li>
<li><strong>Secure Bookings:</strong> Your payments are protected, and bookings are guaranteed.</li>
<li><strong>Real Reviews:</strong> All reviews come from verified clients who completed bookings.</li>
<li><strong>Dedicated Support:</strong> Our team is here to help every step of the way.</li>
</ul>

<h3>Join Our Community</h3>
<p>Whether you''re a client looking for the perfect vendor or a professional ready to grow your business, Planbeau is the place for you. Create your free account today and discover what''s possible.</p>', 
    NULL, N'platform', N'Planbeau Team', N'welcome,introduction,about', 1, 1, 1, GETUTCDATE()),

    (2, N'How Planbeau Protects Your Bookings', N'booking-protection', 
    N'Learn about our comprehensive booking protection and what it means for you.',
    N'<h2>Your Peace of Mind is Our Priority</h2>
<p>At Planbeau, we understand that booking services for important events can feel risky. That''s why we''ve built comprehensive protections into every booking.</p>

<h3>Secure Payments</h3>
<p>All payments are processed through Stripe, a world-leading payment processor trusted by millions of businesses. Your payment information is encrypted and never stored on our servers.</p>

<h3>Verified Vendors</h3>
<p>Every vendor on Planbeau goes through our verification process. We confirm their identity, business information, and review their portfolio before they can accept bookings.</p>

<h3>Booking Guarantee</h3>
<p>If a vendor cancels on you, you''ll receive a full refund automatically. We''ll also help you find a replacement vendor if needed.</p>

<h3>Dispute Resolution</h3>
<p>If something goes wrong, our support team is here to help. We review disputes fairly and can issue refunds when appropriate.</p>

<h3>Communication Records</h3>
<p>All messages between you and vendors are saved on our platform. This creates a clear record of agreements and expectations.</p>', 
    NULL, N'platform', N'Planbeau Team', N'security,protection,payments,trust', 2, 1, 1, GETUTCDATE()),

    -- VENDOR GUIDES
    (3, N'Getting Started as a Vendor on Planbeau', N'vendor-getting-started', 
    N'A complete guide to setting up your vendor profile and landing your first booking.',
    N'<h2>Welcome, Vendors!</h2>
<p>Congratulations on joining Planbeau! This guide will help you set up a compelling profile and start receiving bookings.</p>

<h3>Step 1: Complete Your Profile</h3>
<p>A complete profile builds trust with potential clients. Make sure to:</p>
<ul>
<li>Add a professional profile photo or logo</li>
<li>Write a compelling bio that showcases your experience</li>
<li>List all services you offer with clear descriptions</li>
<li>Set competitive, transparent pricing</li>
</ul>

<h3>Step 2: Build Your Portfolio</h3>
<p>Your portfolio is your visual resume. Upload high-quality images that showcase your best work. Include variety to show your range, and add descriptions to provide context.</p>

<h3>Step 3: Set Your Availability</h3>
<p>Keep your calendar updated to avoid double bookings and show clients when you''re available. Sync with external calendars for automatic updates.</p>

<h3>Step 4: Create Service Packages</h3>
<p>Offer clear packages at different price points. This helps clients understand exactly what they''re getting and makes booking decisions easier.</p>

<h3>Step 5: Respond Quickly</h3>
<p>Fast response times lead to more bookings. Aim to respond to inquiries within a few hours, and always within 24 hours.</p>

<h3>Tips for Success</h3>
<ul>
<li>Ask satisfied clients to leave reviews</li>
<li>Keep your portfolio fresh with recent work</li>
<li>Offer competitive pricing, especially when starting out</li>
<li>Be professional and communicative throughout the booking process</li>
</ul>', 
    5, N'guide', N'Planbeau Team', N'vendor,guide,getting-started,profile', 1, 1, 1, GETUTCDATE()),

    (4, N'Maximizing Your Earnings on Planbeau', N'vendor-maximize-earnings', 
    N'Proven strategies to increase your bookings and grow your business on Planbeau.',
    N'<h2>Grow Your Business with Planbeau</h2>
<p>Success on Planbeau comes from a combination of great service, smart pricing, and effective profile optimization. Here''s how to maximize your earnings.</p>

<h3>Optimize Your Profile for Search</h3>
<p>Clients find vendors through search. Make sure your profile includes relevant keywords in your bio and service descriptions. Be specific about your specialties and the areas you serve.</p>

<h3>Price Strategically</h3>
<p>Research what similar vendors charge and position yourself competitively. Consider offering introductory rates to build reviews, then adjust as your reputation grows.</p>

<h3>Offer Multiple Packages</h3>
<p>Give clients options at different price points. A basic, standard, and premium package structure works well for most services.</p>

<h3>Enable Instant Book</h3>
<p>Vendors with Instant Book enabled often receive more bookings because clients can confirm immediately without waiting.</p>

<h3>Maintain High Ratings</h3>
<p>Your rating directly impacts your visibility and booking rate. Deliver excellent service, communicate clearly, and address any issues promptly.</p>

<h3>Upsell and Cross-Sell</h3>
<p>Offer add-ons and upgrades during the booking process. Many clients are happy to enhance their package for a better experience.</p>

<h3>Build Repeat Business</h3>
<p>Provide exceptional service to turn one-time clients into repeat customers. Follow up after events and stay connected.</p>', 
    5, N'guide', N'Planbeau Team', N'vendor,earnings,business,growth,tips', 2, 1, 0, GETUTCDATE()),

    (5, N'Understanding Planbeau''s Commission Structure', N'vendor-commission-explained', 
    N'A transparent breakdown of how commissions work and what you earn from each booking.',
    N'<h2>How Commissions Work</h2>
<p>Transparency is important to us. Here''s exactly how our commission structure works.</p>

<h3>The Basics</h3>
<p>Planbeau charges a 15% commission on completed bookings. This is deducted from the booking total before your payout.</p>

<h3>What the Commission Covers</h3>
<ul>
<li><strong>Payment Processing:</strong> Secure handling of all transactions</li>
<li><strong>Platform Features:</strong> Booking management, messaging, calendar tools</li>
<li><strong>Marketing:</strong> Bringing clients to the platform</li>
<li><strong>Customer Support:</strong> Help for both vendors and clients</li>
<li><strong>Fraud Protection:</strong> Verification and security measures</li>
</ul>

<h3>Example Calculation</h3>
<p>For a $500 booking:</p>
<ul>
<li>Client pays: $525 (including 5% processing fee)</li>
<li>Commission (15%): $75</li>
<li>Your payout: $425</li>
</ul>

<h3>When You Get Paid</h3>
<p>Payouts are processed automatically after your service is completed. Funds typically arrive in your bank account within 2-7 business days.</p>

<h3>No Hidden Fees</h3>
<p>The 15% commission is all we charge. There are no monthly fees, listing fees, or hidden costs.</p>', 
    5, N'guide', N'Planbeau Team', N'vendor,commission,fees,payments,earnings', 3, 1, 0, GETUTCDATE()),

    -- CLIENT GUIDES
    (6, N'How to Choose the Perfect Vendor', N'client-choosing-vendor', 
    N'Expert tips for finding and selecting the right vendor for your event.',
    N'<h2>Finding Your Perfect Match</h2>
<p>With so many talented vendors on Planbeau, how do you choose the right one? Follow these tips to make a confident decision.</p>

<h3>Define Your Needs</h3>
<p>Before you start browsing, clarify what you''re looking for:</p>
<ul>
<li>What type of service do you need?</li>
<li>What''s your budget?</li>
<li>What date and location?</li>
<li>Any specific style or requirements?</li>
</ul>

<h3>Review Portfolios Carefully</h3>
<p>A vendor''s portfolio shows their style and quality. Look for consistency, variety, and work similar to what you''re envisioning.</p>

<h3>Read Reviews</h3>
<p>Reviews from past clients are invaluable. Pay attention to comments about professionalism, communication, and whether the vendor met expectations.</p>

<h3>Compare Multiple Vendors</h3>
<p>Don''t book the first vendor you find. Save several to your Favorites and compare their offerings, pricing, and reviews.</p>

<h3>Ask Questions</h3>
<p>Message vendors before booking. Ask about their experience with similar events, what''s included in their packages, and any concerns you have.</p>

<h3>Trust Your Instincts</h3>
<p>Beyond qualifications, you want someone you''ll enjoy working with. If communication feels difficult before booking, it may not improve after.</p>', 
    6, N'guide', N'Planbeau Team', N'client,guide,choosing,vendor,tips', 1, 1, 1, GETUTCDATE()),

    (7, N'Planning Your Event Timeline', N'client-event-timeline', 
    N'A helpful guide to booking vendors at the right time for a stress-free event.',
    N'<h2>When to Book Your Vendors</h2>
<p>Timing is everything when planning an event. Here''s a general timeline to help you stay organized.</p>

<h3>12+ Months Before</h3>
<ul>
<li>Venue (if applicable)</li>
<li>Photographer/Videographer (especially for weddings)</li>
<li>Caterer for large events</li>
<li>Popular entertainment (bands, DJs)</li>
</ul>

<h3>6-12 Months Before</h3>
<ul>
<li>Florist</li>
<li>Event planner/coordinator</li>
<li>Officiant (for weddings)</li>
<li>Hair and makeup artists</li>
</ul>

<h3>3-6 Months Before</h3>
<ul>
<li>Photo booth</li>
<li>Transportation</li>
<li>Rentals (chairs, tables, linens)</li>
<li>Cake/desserts</li>
</ul>

<h3>1-3 Months Before</h3>
<ul>
<li>Finalize details with all vendors</li>
<li>Confirm timelines and logistics</li>
<li>Make final payments</li>
</ul>

<h3>Tips</h3>
<ul>
<li>Book earlier during peak seasons (May-October for weddings)</li>
<li>Popular vendors book up fast—don''t wait too long</li>
<li>Keep all vendor contacts and contracts organized</li>
</ul>', 
    6, N'guide', N'Planbeau Team', N'client,planning,timeline,event,booking', 2, 1, 0, GETUTCDATE()),

    -- PLATFORM NEWS/UPDATES
    (8, N'Introducing Enhanced Messaging Features', N'new-messaging-features', 
    N'We''ve upgraded our messaging system to make communication even easier.',
    N'<h2>Better Communication, Better Bookings</h2>
<p>We''re excited to announce significant improvements to our messaging system!</p>

<h3>What''s New</h3>
<ul>
<li><strong>Real-time Notifications:</strong> Get instant alerts when you receive new messages</li>
<li><strong>Read Receipts:</strong> Know when your messages have been seen</li>
<li><strong>File Sharing:</strong> Easily share images, documents, and contracts</li>
<li><strong>Message Search:</strong> Find past conversations quickly</li>
</ul>

<h3>Why It Matters</h3>
<p>Clear communication is essential for successful bookings. These features help vendors and clients stay connected and aligned throughout the booking process.</p>

<h3>How to Use</h3>
<p>Access messages from your Dashboard or click the message icon in the header. All your conversations are organized and easy to navigate.</p>', 
    NULL, N'news', N'Planbeau Team', N'news,update,messaging,features', 1, 1, 0, GETUTCDATE()),

    (9, N'Our Commitment to Vendor Success', N'vendor-success-commitment', 
    N'How Planbeau supports vendors in building thriving businesses.',
    N'<h2>Your Success is Our Success</h2>
<p>At Planbeau, we''re committed to helping vendors build successful, sustainable businesses. Here''s how we support you.</p>

<h3>Fair Commission Structure</h3>
<p>Our 15% commission is competitive and transparent. There are no hidden fees, monthly charges, or listing costs.</p>

<h3>Marketing Support</h3>
<p>We invest in marketing to bring clients to the platform. When you''re on Planbeau, you benefit from our advertising and SEO efforts.</p>

<h3>Tools for Growth</h3>
<p>Our vendor dashboard provides analytics, booking management, and calendar tools to help you run your business efficiently.</p>

<h3>Dedicated Support</h3>
<p>Our support team is here to help with any questions or issues. We''re invested in your success.</p>

<h3>Community</h3>
<p>Join a community of talented professionals. Share experiences, learn from others, and grow together.</p>', 
    5, N'platform', N'Planbeau Team', N'vendor,support,success,community', 3, 1, 0, GETUTCDATE()),

    (10, N'The Future of Event Services', N'future-of-events', 
    N'Exploring trends and innovations shaping the event services industry.',
    N'<h2>Where the Industry is Heading</h2>
<p>The event services industry is evolving rapidly. Here''s what we see on the horizon.</p>

<h3>Technology Integration</h3>
<p>From virtual consultations to AI-powered matching, technology is making it easier than ever to connect clients with the right vendors.</p>

<h3>Personalization</h3>
<p>Clients increasingly want unique, personalized experiences. Vendors who can customize their offerings will thrive.</p>

<h3>Sustainability</h3>
<p>Eco-friendly practices are becoming important to many clients. Vendors who offer sustainable options have a competitive advantage.</p>

<h3>Hybrid Events</h3>
<p>The blend of in-person and virtual elements is here to stay. Vendors who can accommodate both will capture more opportunities.</p>

<h3>Our Role</h3>
<p>Planbeau is committed to staying at the forefront of these trends, providing the tools and platform vendors and clients need to succeed in this evolving landscape.</p>', 
    NULL, N'platform', N'Planbeau Team', N'trends,future,industry,innovation', 4, 1, 1, GETUTCDATE());

    SET IDENTITY_INSERT [admin].[Articles] OFF;

    PRINT 'Inserted 10 records into [admin].[Articles].';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Articles] already contains data. Skipping.';
END
GO
