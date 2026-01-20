/*
    Migration Script: Data - [FAQs] - CONSOLIDATED
    Phase: 900 - Data
    Script: cu_900_81_admin.FAQs.sql
    Description: Comprehensive Help Centre FAQ articles for Planbeau
    
    Each FAQ contains detailed, step-by-step instructions with rich HTML formatting.
    This is the ONLY FAQs migration file needed.
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting comprehensive FAQ data into [admin].[FAQs]...';
GO

DELETE FROM [admin].[FAQs];
GO

SET IDENTITY_INSERT [admin].[FAQs] ON;
GO

-- =============================================
-- GETTING STARTED (IDs 1-4)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(1, N'What is Planbeau and how does it work?', 
N'<p>Planbeau is Canada''s premier online marketplace that connects clients with talented, verified event and creative service professionals. Whether you''re planning a wedding, corporate event, birthday celebration, photoshoot, or any special occasion, Planbeau makes it simple to discover, compare, and book the perfect vendors for your needs.</p>

<h2>How Planbeau Works</h2>

<h3>For Clients</h3>

<p>Finding and booking vendors on Planbeau is straightforward and secure. Here''s how the process works:</p>

<h4>Step 1: Browse and Discover</h4>
<ol>
<li>Visit the <strong>Planbeau homepage</strong> at planbeau.com</li>
<li>Use the <strong>search bar</strong> to find vendors by service type, location, or name</li>
<li>Alternatively, click <strong>"Browse"</strong> to explore vendors by category</li>
<li>Apply <strong>filters</strong> to narrow results by price, rating, availability, and more</li>
</ol>

<div class="info-box">
<strong>Pro Tip:</strong> Use specific keywords like "wedding photographer Toronto" or "corporate caterer Vancouver" for more targeted results.
</div>

<h4>Step 2: Review Vendor Profiles</h4>
<p>Each vendor profile includes:</p>
<ul>
<li><strong>Portfolio:</strong> High-quality images and videos of their work</li>
<li><strong>Services & Pricing:</strong> Detailed packages with transparent pricing</li>
<li><strong>Reviews:</strong> Authentic feedback from verified clients</li>
<li><strong>About:</strong> The vendor''s story, experience, and approach</li>
<li><strong>Availability:</strong> Real-time calendar showing open dates</li>
</ul>

<h4>Step 3: Connect and Book</h4>
<ol>
<li>Click <strong>"Message"</strong> to ask questions before booking</li>
<li>When ready, click <strong>"Book Now"</strong> or <strong>"Request Booking"</strong></li>
<li>Select your event date, time, and preferred package</li>
<li>Add any special requirements or notes</li>
<li>Submit your booking request</li>
</ol>

<h4>Step 4: Confirm and Pay</h4>
<ol>
<li>The vendor reviews your request (typically within 24-48 hours)</li>
<li>Once approved, you''ll receive a notification</li>
<li>Complete secure payment through Stripe</li>
<li>Receive instant confirmation with all booking details</li>
</ol>

<h3>For Vendors</h3>

<p>Planbeau provides vendors with powerful tools to grow their business:</p>
<ul>
<li><strong>Professional Profile:</strong> Showcase your work with a stunning portfolio</li>
<li><strong>Booking Management:</strong> Handle requests, calendar, and client communication</li>
<li><strong>Secure Payments:</strong> Get paid automatically after completing services</li>
<li><strong>Reviews & Ratings:</strong> Build your reputation with verified client feedback</li>
<li><strong>Analytics:</strong> Track profile views, booking rates, and performance</li>
</ul>

<h2>Why Choose Planbeau?</h2>

<table>
<tr><th>Feature</th><th>Benefit</th></tr>
<tr><td>Verified Vendors</td><td>Every vendor undergoes identity and business verification</td></tr>
<tr><td>Transparent Pricing</td><td>See prices upfront—no hidden fees or surprises</td></tr>
<tr><td>Secure Payments</td><td>Bank-level encryption through Stripe</td></tr>
<tr><td>Authentic Reviews</td><td>Only verified clients can leave reviews</td></tr>
<tr><td>Direct Communication</td><td>Message vendors directly through the platform</td></tr>
<tr><td>Booking Protection</td><td>Support team available to help resolve any issues</td></tr>
</table>

<h2>Service Categories Available</h2>

<p>Planbeau offers vendors across numerous categories:</p>
<ul>
<li><strong>Photography:</strong> Wedding, portrait, commercial, event, engagement</li>
<li><strong>Videography:</strong> Wedding films, corporate videos, event coverage</li>
<li><strong>DJs & Entertainment:</strong> DJs, live bands, performers, MCs</li>
<li><strong>Catering:</strong> Full-service catering, food trucks, specialty cuisines</li>
<li><strong>Florists:</strong> Wedding florals, event arrangements, installations</li>
<li><strong>Hair & Makeup:</strong> Bridal beauty, event styling, on-location services</li>
<li><strong>Event Planning:</strong> Full planning, day-of coordination, design</li>
<li><strong>Photo Booths:</strong> Traditional, mirror, 360°, GIF booths</li>
<li><strong>Officiants:</strong> Wedding officiants, ceremony services</li>
<li><strong>Decorators:</strong> Event styling, rentals, installations</li>
<li><strong>And many more...</strong></li>
</ul>

<p><strong>Ready to get started?</strong> <a href="/signup">Create your free account</a> and start exploring vendors today!</p>', 
N'Getting Started', 1, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQ 1';
GO

-- FAQ 2: How do I create an account
INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(2, N'How do I create an account on Planbeau?', 
N'<p>Creating a Planbeau account is quick, easy, and completely free. Follow this step-by-step guide to get started.</p>

<h2>Step 1: Go to the Sign Up Page</h2>
<ol>
<li>Visit <strong>planbeau.com</strong> in your web browser</li>
<li>Click the <strong>"Sign Up"</strong> button in the top-right corner of the page</li>
<li>You''ll be taken to the registration page</li>
</ol>

<h2>Step 2: Choose Your Sign-Up Method</h2>

<h3>Option A: Sign Up with Email</h3>
<ol>
<li>Enter your <strong>email address</strong> in the email field</li>
<li>Create a <strong>strong password</strong> (minimum 8 characters, including at least one number)</li>
<li>Enter your <strong>first name</strong> and <strong>last name</strong></li>
<li>Click the <strong>"Create Account"</strong> button</li>
<li>Check your email inbox for a <strong>verification email</strong></li>
<li>Click the verification link in the email to activate your account</li>
</ol>

<div class="warning-box">
<strong>Important:</strong> If you don''t see the verification email, check your spam or junk folder. Add noreply@planbeau.com to your contacts to ensure future emails arrive in your inbox.
</div>

<h3>Option B: Sign Up with Google (Recommended)</h3>
<ol>
<li>Click the <strong>"Continue with Google"</strong> button</li>
<li>Select your Google account from the popup</li>
<li>Grant permission for Planbeau to access your basic profile information</li>
<li>You''re done! No email verification required.</li>
</ol>

<h2>Step 3: Complete Your Profile</h2>
<ol>
<li>Click on your <strong>profile icon</strong> in the top-right corner</li>
<li>Select <strong>"Edit Profile"</strong> from the dropdown menu</li>
<li>Add a <strong>profile photo</strong> (helps vendors recognize you)</li>
<li>Enter your <strong>phone number</strong> (optional, for booking notifications)</li>
<li>Set your <strong>location</strong> (helps us show relevant vendors)</li>
<li>Configure your <strong>notification preferences</strong></li>
<li>Click <strong>"Save Changes"</strong></li>
</ol>

<h2>Troubleshooting Sign-Up Issues</h2>

<h3>Didn''t receive verification email?</h3>
<ul>
<li>Check your spam/junk folder</li>
<li>Wait a few minutes and check again</li>
<li>Click "Resend verification email" on the login page</li>
<li>Try adding noreply@planbeau.com to your contacts</li>
</ul>

<h3>Email already registered?</h3>
<p>If you see this error, you may have already created an account. Try clicking "Forgot Password" to reset your password or signing in with Google if you originally used that method.</p>

<p><strong>Need help?</strong> Contact our support team at support@planbeau.com</p>', 
N'Getting Started', 2, 1, 0, 0, 0, 0);
GO

-- FAQ 3: How do I search for vendors
INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(3, N'How do I search for and find vendors?', 
N'<p>Finding the perfect vendor on Planbeau is easy with our powerful search and filtering tools. This guide walks you through every method available.</p>

<h2>Step 1: Search for Vendors</h2>

<h3>Using the Search Bar</h3>
<ol>
<li>Go to the <strong>Planbeau homepage</strong></li>
<li>Enter what you''re looking for in the search bar (e.g., "wedding photographer Toronto")</li>
<li>Press <strong>Enter</strong> or click the search icon</li>
</ol>

<div class="info-box">
<strong>Search Tips:</strong> Use specific keywords to find exactly what you need. Try combinations like "DJ Vancouver", "Indian wedding caterer", or "outdoor wedding photographer".
</div>

<h3>Browsing by Category</h3>
<ol>
<li>Click on <strong>"Browse"</strong> in the navigation menu</li>
<li>Select a category (Photography, Catering, DJs, etc.)</li>
<li>View all vendors in that category</li>
</ol>

<h3>Using Filters</h3>
<p>Narrow down your results using the filter options:</p>
<ul>
<li><strong>Location:</strong> Set your city or adjust the distance radius</li>
<li><strong>Price Range:</strong> Set minimum and maximum budget</li>
<li><strong>Rating:</strong> Filter by minimum star rating</li>
<li><strong>Availability:</strong> Check vendors available on your date</li>
<li><strong>Instant Book:</strong> Show only vendors who accept instant bookings</li>
</ul>

<h2>Step 2: Review Vendor Profiles</h2>
<p>Click on a vendor card to view their full profile including:</p>
<ul>
<li><strong>Portfolio Gallery:</strong> High-quality images and videos</li>
<li><strong>Services & Pricing:</strong> Available packages and costs</li>
<li><strong>Reviews & Ratings:</strong> Authentic feedback from verified clients</li>
<li><strong>About:</strong> Their background and experience</li>
<li><strong>Availability Calendar:</strong> Check if they''re available on your date</li>
</ul>

<h2>Step 3: Save and Compare Vendors</h2>
<ol>
<li>Click the <strong>heart icon</strong> on any vendor profile to save to Favorites</li>
<li>Access your favorites from <strong>Dashboard → Favorites</strong></li>
<li>Compare pricing, portfolios, and availability side by side</li>
</ol>

<h2>Step 4: Contact Vendors</h2>
<ol>
<li>Click the <strong>"Message"</strong> button on the vendor''s profile</li>
<li>Write your message with any questions or requirements</li>
<li>Click <strong>"Send"</strong></li>
<li>The vendor will respond (typically within 24 hours)</li>
</ol>

<p><strong>Ready to find your perfect vendor?</strong> <a href="/">Start searching now</a></p>', 
N'Getting Started', 3, 1, 0, 0, 0, 0);
GO

-- FAQ 4: Is Planbeau free
INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(4, N'Is Planbeau free to use?', 
N'<p>Yes! Planbeau is completely free for clients to use. This guide explains our pricing structure for both clients and vendors.</p>

<h2>For Clients: Completely Free</h2>

<table>
<tr><th>Feature</th><th>Cost</th></tr>
<tr><td>Creating an account</td><td>Free</td></tr>
<tr><td>Browsing all vendor profiles</td><td>Free</td></tr>
<tr><td>Viewing portfolios and galleries</td><td>Free</td></tr>
<tr><td>Reading reviews and ratings</td><td>Free</td></tr>
<tr><td>Sending messages to vendors</td><td>Free</td></tr>
<tr><td>Submitting booking requests</td><td>Free</td></tr>
<tr><td>Using search and filter tools</td><td>Free</td></tr>
<tr><td>Saving favorite vendors</td><td>Free</td></tr>
</table>

<h3>What You Pay For</h3>
<p>You only pay when you actually book a vendor. Your payment includes:</p>
<ol>
<li><strong>Service Price:</strong> The vendor''s rate for their services</li>
<li><strong>Processing Fee:</strong> A small fee (~5%) for secure payment processing</li>
<li><strong>Taxes:</strong> Applicable GST/HST/PST based on your province</li>
</ol>

<h2>For Vendors: Commission-Based</h2>
<p>Vendors can join Planbeau for free. We only charge when you earn:</p>
<ul>
<li>Creating a vendor account: <strong>Free</strong></li>
<li>Setting up your profile: <strong>Free</strong></li>
<li>Listing your services: <strong>Free</strong></li>
<li>Commission on completed bookings: <strong>15%</strong></li>
</ul>

<h2>No Hidden Fees</h2>
<p>We believe in complete transparency. There are no subscription fees, listing fees, monthly charges, or setup costs.</p>

<p><strong>Questions about pricing?</strong> Contact support@planbeau.com</p>', 
N'Getting Started', 4, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 2-4';
GO

-- =============================================
-- BOOKING & RESERVATIONS (IDs 5-10)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(5, N'How do I book a vendor?', 
N'<p>Booking a vendor on Planbeau is straightforward and secure. This comprehensive guide walks you through every step of the process, from finding the perfect vendor to confirming your booking.</p>

<h2>Step 1: Search for Vendors</h2>
<ol>
<li>Go to the <strong>Planbeau homepage</strong></li>
<li>Enter what you''re looking for in the search bar (e.g., "wedding photographer Toronto")</li>
<li>Press <strong>Enter</strong> or click the search icon</li>
<li>Use <strong>filters</strong> to narrow results by price, rating, availability</li>
</ol>

<h2>Step 2: Review Vendor Profiles</h2>
<p>Click on a vendor card to view their full profile including portfolio, services, pricing, reviews, and availability calendar.</p>

<h2>Step 3: Submit a Booking Request</h2>
<ol>
<li>Click the <strong>"Book Now"</strong> or <strong>"Request Booking"</strong> button</li>
<li>Select your <strong>event date</strong> from the calendar</li>
<li>Choose your <strong>start time</strong> and <strong>duration</strong></li>
<li>Select a <strong>service package</strong> from the available options</li>
<li>Add any <strong>special requests or notes</strong> for the vendor</li>
<li>Review the <strong>total cost breakdown</strong> including fees and taxes</li>
<li>Click <strong>"Submit Request"</strong></li>
</ol>

<div class="info-box">
<strong>Tip:</strong> Include as much detail as possible in your notes. This helps the vendor understand your needs and respond appropriately.
</div>

<h2>Step 4: Wait for Vendor Response</h2>
<ul>
<li>The vendor receives an <strong>instant notification</strong></li>
<li>They have <strong>48 hours</strong> to respond to your request</li>
<li>You''ll receive notifications about any updates</li>
</ul>

<h3>Possible Responses</h3>
<table>
<tr><th>Response</th><th>What It Means</th><th>Next Steps</th></tr>
<tr><td>Approved</td><td>Vendor accepts your booking</td><td>Proceed to payment</td></tr>
<tr><td>Declined</td><td>Vendor cannot accommodate</td><td>Book another vendor</td></tr>
<tr><td>More Info Needed</td><td>Vendor has questions</td><td>Respond via messages</td></tr>
</table>

<h2>Step 5: Complete Payment</h2>
<ol>
<li>You''ll receive a notification to <strong>complete payment</strong></li>
<li>Go to <strong>Dashboard → Bookings</strong></li>
<li>Find your approved booking and click <strong>"Pay Now"</strong></li>
<li>Enter your <strong>payment details</strong> (credit/debit card)</li>
<li>Click <strong>"Confirm Payment"</strong></li>
</ol>

<h2>Step 6: Booking Confirmed!</h2>
<ul>
<li>You''ll receive a <strong>confirmation email</strong> with all booking details</li>
<li>The booking appears in your <strong>Dashboard → Bookings</strong> as "Confirmed"</li>
<li>You can <strong>message the vendor</strong> to coordinate details</li>
</ul>

<p><strong>Ready to book?</strong> <a href="/">Find your perfect vendor now</a></p>', 
N'Booking', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(6, N'What happens after I submit a booking request?', 
N'<p>After you submit a booking request on Planbeau, several things happen. This guide explains the entire process so you know exactly what to expect.</p>

<h2>Immediately After Submission</h2>
<ol>
<li>A <strong>confirmation message</strong> appears on screen confirming your request was submitted</li>
<li>You''ll receive a <strong>confirmation email</strong> with your request details</li>
<li>The request appears in your <strong>Dashboard → Bookings</strong> with status "Pending"</li>
</ol>

<h2>What the Vendor Receives</h2>
<ul>
<li>An <strong>instant email notification</strong> about your booking request</li>
<li>An <strong>in-app notification</strong> in their vendor dashboard</li>
<li>All the details you provided (date, time, package, notes)</li>
</ul>

<h2>The Vendor Review Period</h2>
<p>Vendors have <strong>48 hours</strong> to respond to your booking request. During this time, they will review your event details, check their availability, and decide whether to accept.</p>

<h2>Possible Vendor Responses</h2>

<h3>Response 1: Approved ✓</h3>
<ul>
<li>You''ll receive an <strong>email notification</strong></li>
<li>Your booking status changes to <strong>"Approved - Awaiting Payment"</strong></li>
<li>You''ll have a <strong>payment deadline</strong> (typically 24-48 hours)</li>
</ul>
<p><strong>Next Step:</strong> Complete payment to confirm your booking.</p>

<h3>Response 2: Declined ✗</h3>
<ul>
<li>You''ll receive a notification with the reason (if provided)</li>
<li>Your booking status changes to <strong>"Declined"</strong></li>
<li>No payment is required</li>
</ul>
<p><strong>Next Step:</strong> Search for and book another vendor.</p>

<h3>Response 3: More Information Needed</h3>
<ul>
<li>You''ll receive a <strong>message from the vendor</strong></li>
<li>They may ask about specific requirements or details</li>
<li>Your booking remains in <strong>"Pending"</strong> status</li>
</ul>
<p><strong>Next Step:</strong> Respond to their questions via the messaging system.</p>

<h2>If the Vendor Doesn''t Respond</h2>
<p>If 48 hours pass without a response, the booking request <strong>automatically expires</strong>. You''ll receive a notification and can book another vendor.</p>

<h2>Booking Status Guide</h2>
<table>
<tr><th>Status</th><th>Meaning</th></tr>
<tr><td>Pending</td><td>Waiting for vendor response</td></tr>
<tr><td>Approved</td><td>Vendor accepted, awaiting your payment</td></tr>
<tr><td>Confirmed</td><td>Payment complete, booking is confirmed</td></tr>
<tr><td>Declined</td><td>Vendor could not accommodate</td></tr>
<tr><td>Expired</td><td>No response within 48 hours</td></tr>
<tr><td>Cancelled</td><td>Booking was cancelled</td></tr>
<tr><td>Completed</td><td>Service has been delivered</td></tr>
</table>

<p><strong>Questions?</strong> Contact support@planbeau.com</p>', 
N'Booking', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(7, N'Can I modify my booking after it''s confirmed?', 
N'<p>Yes, you can request modifications to confirmed bookings on Planbeau. This guide explains how to make changes and what to expect.</p>

<h2>Types of Modifications</h2>
<ul>
<li><strong>Date or time changes:</strong> Reschedule to a different date or adjust start time</li>
<li><strong>Duration adjustments:</strong> Extend or shorten the service duration</li>
<li><strong>Service changes:</strong> Upgrade, downgrade, or modify your package</li>
<li><strong>Add-ons:</strong> Add extra services or features</li>
<li><strong>Location updates:</strong> Change the event venue or address</li>
<li><strong>Special requests:</strong> Add new requirements or preferences</li>
</ul>

<h2>How to Request a Modification</h2>

<h3>Step 1: Access Your Booking</h3>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Bookings"</strong> in the sidebar</li>
<li>Find your confirmed booking</li>
<li>Click to open the booking details</li>
</ol>

<h3>Step 2: Submit Modification Request</h3>
<ol>
<li>Click the <strong>"Request Modification"</strong> button</li>
<li>Select the type of change you want to make</li>
<li>Provide details about your requested changes</li>
<li>Explain the reason for the modification (optional but helpful)</li>
<li>Click <strong>"Submit Request"</strong></li>
</ol>

<h3>Step 3: Wait for Vendor Response</h3>
<p>The vendor will review and respond (typically within 24-48 hours). You''ll be notified of their decision.</p>

<h2>What Happens Next</h2>

<h3>If the Vendor Approves</h3>
<ul>
<li>Your booking is updated with the new details</li>
<li>If there''s a price difference, you''ll be notified</li>
<li>Additional payment may be required for upgrades</li>
<li>Partial refund may be issued for downgrades</li>
</ul>

<h3>If the Vendor Declines</h3>
<ul>
<li>Your original booking remains unchanged</li>
<li>The vendor may provide a reason</li>
<li>You can discuss alternatives via messaging</li>
</ul>

<h2>Important Considerations</h2>
<ul>
<li>Vendors are not obligated to accept modification requests</li>
<li>Changes close to the event date may be harder to accommodate</li>
<li>Some changes may require canceling and rebooking</li>
<li>Always check the vendor''s modification policy</li>
</ul>

<p><strong>Need help with a modification?</strong> Contact support@planbeau.com</p>', 
N'Booking', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(8, N'How far in advance should I book vendors?', 
N'<p>Booking timing can significantly impact your vendor options and pricing. This guide provides recommended timelines for different event types.</p>

<h2>Recommended Booking Timelines</h2>

<h3>Weddings</h3>
<table>
<tr><th>Vendor Type</th><th>Recommended Timeline</th></tr>
<tr><td>Venue</td><td>12-18 months</td></tr>
<tr><td>Photographer</td><td>12-18 months</td></tr>
<tr><td>Videographer</td><td>12-18 months</td></tr>
<tr><td>Caterer</td><td>9-12 months</td></tr>
<tr><td>DJ/Band</td><td>9-12 months</td></tr>
<tr><td>Florist</td><td>9-12 months</td></tr>
<tr><td>Hair & Makeup</td><td>6-9 months</td></tr>
<tr><td>Photo Booth</td><td>6-9 months</td></tr>
<tr><td>Cake/Desserts</td><td>3-6 months</td></tr>
</table>

<h3>Corporate Events</h3>
<table>
<tr><th>Event Type</th><th>Recommended Timeline</th></tr>
<tr><td>Large conferences</td><td>6-12 months</td></tr>
<tr><td>Company galas</td><td>4-6 months</td></tr>
<tr><td>Holiday parties</td><td>3-6 months</td></tr>
<tr><td>Team building events</td><td>2-4 months</td></tr>
<tr><td>Small meetings</td><td>2-4 weeks</td></tr>
</table>

<h3>Private Parties</h3>
<table>
<tr><th>Event Type</th><th>Recommended Timeline</th></tr>
<tr><td>Milestone birthdays</td><td>3-6 months</td></tr>
<tr><td>Anniversary celebrations</td><td>2-4 months</td></tr>
<tr><td>Graduation parties</td><td>2-3 months</td></tr>
<tr><td>Standard birthday parties</td><td>1-2 months</td></tr>
</table>

<h2>Peak Season Considerations</h2>
<p>Book even earlier during high-demand periods:</p>
<ul>
<li><strong>Wedding Season (May - October):</strong> Saturdays book 12-18 months in advance</li>
<li><strong>Holiday Season (November - December):</strong> Book by September</li>
<li><strong>Graduation Season (May - June):</strong> Book by February/March</li>
</ul>

<h2>Last-Minute Bookings</h2>
<p>Need a vendor quickly? Here''s how to improve your chances:</p>
<ol>
<li>Use Planbeau''s <strong>availability filter</strong> to find vendors with open dates</li>
<li>Consider <strong>weekday events</strong> for better availability</li>
<li>Be <strong>flexible with timing</strong></li>
<li>Look at <strong>newer vendors</strong> building their portfolios</li>
<li>Be ready to <strong>book and pay quickly</strong></li>
</ol>

<p><strong>Ready to start booking?</strong> <a href="/">Search for vendors now</a></p>', 
N'Booking', 4, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(9, N'What is Instant Book and how does it work?', 
N'<p>Instant Book is a feature that allows you to confirm a booking immediately without waiting for vendor approval.</p>

<h2>What is Instant Book?</h2>
<p>When enabled, clients can book and pay immediately without waiting for the vendor to manually approve the request.</p>

<h3>Standard Booking vs. Instant Book</h3>
<table>
<tr><th>Feature</th><th>Standard Booking</th><th>Instant Book</th></tr>
<tr><td>Submit request</td><td>Yes</td><td>Yes</td></tr>
<tr><td>Wait for approval</td><td>Up to 48 hours</td><td>No waiting</td></tr>
<tr><td>Pay immediately</td><td>After approval</td><td>Yes</td></tr>
<tr><td>Confirmation</td><td>After payment</td><td>Instant</td></tr>
</table>

<h2>How to Use Instant Book</h2>

<h3>Step 1: Find Instant Book Vendors</h3>
<ol>
<li>Search for vendors in your desired category</li>
<li>Look for the <strong>"Instant Book"</strong> badge on vendor cards</li>
<li>Or use the <strong>"Instant Book"</strong> filter</li>
</ol>

<h3>Step 2: Check Availability</h3>
<ol>
<li>Click on the vendor''s profile</li>
<li>View their <strong>availability calendar</strong></li>
<li>Select your desired date</li>
</ol>

<h3>Step 3: Complete Your Booking</h3>
<ol>
<li>Click <strong>"Instant Book"</strong> or <strong>"Book Now"</strong></li>
<li>Select your event date and time</li>
<li>Choose your service package</li>
<li>Enter your payment information</li>
<li>Click <strong>"Confirm and Pay"</strong></li>
</ol>

<h3>Step 4: Booking Confirmed!</h3>
<p>Immediately after payment, your booking is <strong>instantly confirmed</strong>. You receive a confirmation email and can message the vendor to coordinate details.</p>

<h2>Benefits of Instant Book</h2>
<ul>
<li><strong>No waiting:</strong> Skip the approval process entirely</li>
<li><strong>Guaranteed availability:</strong> If the date shows available, it''s yours</li>
<li><strong>Faster planning:</strong> Lock in vendors quickly</li>
<li><strong>Peace of mind:</strong> Immediate confirmation</li>
</ul>

<p><strong>Ready to try Instant Book?</strong> <a href="/">Find Instant Book vendors now</a></p>', 
N'Booking', 5, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(10, N'How do I view my booking history?', 
N'<p>Access all your bookings easily from your dashboard. This guide shows you how to view, manage, and track your booking history.</p>

<h2>Accessing Your Bookings</h2>
<ol>
<li>Log in to your Planbeau account</li>
<li>Click on your <strong>profile icon</strong> in the top-right corner</li>
<li>Select <strong>"Dashboard"</strong> from the dropdown menu</li>
<li>Click on <strong>"Bookings"</strong> in the sidebar</li>
</ol>

<h2>Filtering Your Bookings</h2>
<p>Use the filter tabs to view bookings by status:</p>
<ul>
<li><strong>All:</strong> View all bookings regardless of status</li>
<li><strong>Pending:</strong> Awaiting vendor response or payment</li>
<li><strong>Upcoming:</strong> Confirmed bookings for future dates</li>
<li><strong>Completed:</strong> Past bookings that have been fulfilled</li>
<li><strong>Cancelled:</strong> Bookings that were cancelled</li>
</ul>

<h2>Booking Details</h2>
<p>Click on any booking to view full details:</p>
<ul>
<li><strong>Vendor Information:</strong> Name, contact, profile link</li>
<li><strong>Service Details:</strong> Package, date, time, duration</li>
<li><strong>Event Location:</strong> Venue address and notes</li>
<li><strong>Payment Status:</strong> Paid, pending, refunded</li>
<li><strong>Invoice:</strong> Download or print your receipt</li>
<li><strong>Messages:</strong> View conversation with vendor</li>
<li><strong>Cancellation Policy:</strong> Terms for this booking</li>
</ul>

<h2>Actions Available</h2>
<p>From your booking details, you can:</p>
<ul>
<li><strong>Message Vendor:</strong> Send a message to coordinate</li>
<li><strong>Request Modification:</strong> Ask for changes to your booking</li>
<li><strong>Cancel Booking:</strong> Cancel according to the policy</li>
<li><strong>Leave Review:</strong> Rate your experience (after completion)</li>
<li><strong>Download Invoice:</strong> Get a PDF receipt</li>
<li><strong>Rebook:</strong> Book the same vendor again</li>
</ul>

<p><strong>Need help with a booking?</strong> Contact support@planbeau.com</p>', 
N'Booking', 6, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 5-10 (Booking)';
GO

-- =============================================
-- PAYMENTS & BILLING (IDs 11-16)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(11, N'What payment methods are accepted?', 
N'<p>Planbeau accepts secure payments through Stripe, one of the world''s leading payment processors.</p>

<h2>Accepted Payment Methods</h2>
<h3>Credit Cards</h3>
<ul>
<li><strong>Visa</strong></li>
<li><strong>Mastercard</strong></li>
<li><strong>American Express</strong></li>
<li><strong>Discover</strong></li>
</ul>

<h3>Debit Cards</h3>
<p>Debit cards with Visa or Mastercard logos are accepted.</p>

<h2>Payment Security</h2>
<table>
<tr><th>Feature</th><th>Protection</th></tr>
<tr><td>256-bit SSL Encryption</td><td>All data encrypted during transmission</td></tr>
<tr><td>PCI DSS Level 1</td><td>Highest level of payment security certification</td></tr>
<tr><td>Tokenization</td><td>Card numbers replaced with secure tokens</td></tr>
<tr><td>Fraud Detection</td><td>Advanced AI monitors every transaction</td></tr>
</table>

<h2>How to Make a Payment</h2>
<ol>
<li>After vendor approves your booking, you''ll receive a notification</li>
<li>Go to <strong>Dashboard → Bookings</strong></li>
<li>Find your approved booking and click <strong>"Pay Now"</strong></li>
<li>Enter your card details</li>
<li>Click <strong>"Confirm Payment"</strong></li>
</ol>

<p><strong>Payment questions?</strong> Contact support@planbeau.com</p>', 
N'Payments', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(12, N'When do I need to pay for my booking?', 
N'<p>Understanding when payment is required helps you plan your booking process.</p>

<h2>Standard Payment Timeline</h2>
<ol>
<li><strong>Submit booking request</strong> — No payment required yet</li>
<li><strong>Vendor reviews request</strong> — Still no payment</li>
<li><strong>Vendor approves</strong> — Payment notification sent</li>
<li><strong>Complete payment</strong> — Required to confirm booking (24-48 hour deadline)</li>
<li><strong>Booking confirmed</strong> — You''re all set!</li>
</ol>

<h2>Payment Deadlines</h2>
<p>After vendor approval, you typically have <strong>24-48 hours</strong> to complete payment. If payment isn''t received, the booking may be released.</p>

<h2>Instant Book Payments</h2>
<p>For Instant Book vendors, payment is required immediately at the time of booking. There''s no approval waiting period.</p>

<h2>Deposit Options</h2>
<p>Some vendors may offer deposit options:</p>
<ul>
<li><strong>Full payment upfront:</strong> Pay 100% to confirm</li>
<li><strong>Deposit + balance:</strong> Pay a percentage now, remainder later</li>
</ul>

<p>Check the vendor''s payment terms before booking.</p>', 
N'Payments', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(13, N'Is my payment information secure?', 
N'<p>Yes, absolutely. We take payment security very seriously and use industry-leading protection measures.</p>

<h2>How We Protect Your Payment</h2>

<h3>Stripe Payment Processing</h3>
<p>All payments are processed through <strong>Stripe</strong>, trusted by millions of businesses worldwide including Amazon, Google, and Shopify.</p>

<h3>Security Measures</h3>
<ul>
<li><strong>256-bit SSL Encryption:</strong> All data is encrypted during transmission</li>
<li><strong>PCI DSS Level 1:</strong> Highest level of payment security certification</li>
<li><strong>Tokenization:</strong> Your card number is replaced with a secure token</li>
<li><strong>Fraud Detection:</strong> Advanced AI monitors every transaction</li>
<li><strong>3D Secure:</strong> Additional verification for supported cards</li>
</ul>

<h3>What We Don''t Store</h3>
<ul>
<li>Your full credit card number</li>
<li>Your CVV/security code</li>
<li>Your card PIN</li>
</ul>

<p>We only store the last 4 digits of your card for reference purposes.</p>

<h2>Tips for Safe Payments</h2>
<ul>
<li>Always pay through the Planbeau platform</li>
<li>Never share card details via message or email</li>
<li>Look for the padlock icon in your browser</li>
<li>Keep your account password secure</li>
</ul>', 
N'Payments', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(14, N'How do I view and download my invoices?', 
N'<p>Access your invoices easily from your dashboard. This guide shows you how to view, download, and manage your payment records.</p>

<h2>Accessing Your Invoices</h2>
<ol>
<li>Log in to your Planbeau account</li>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Invoices"</strong> in the sidebar</li>
<li>View all your invoices in one place</li>
</ol>

<h2>Invoice Information</h2>
<p>Each invoice includes:</p>
<ul>
<li><strong>Invoice number</strong> and date</li>
<li><strong>Vendor details:</strong> Name and business information</li>
<li><strong>Service details:</strong> Package, date, and description</li>
<li><strong>Price breakdown:</strong> Service cost, fees, and taxes</li>
<li><strong>Payment status:</strong> Paid, pending, or refunded</li>
<li><strong>Payment method:</strong> Card type and last 4 digits</li>
</ul>

<h2>Downloading Invoices</h2>
<ol>
<li>Find the invoice you need</li>
<li>Click the <strong>"Download"</strong> or <strong>"PDF"</strong> button</li>
<li>Save the PDF to your device</li>
<li>Print if needed for your records</li>
</ol>

<h2>Invoice Uses</h2>
<p>Your invoices can be used for:</p>
<ul>
<li>Personal record keeping</li>
<li>Business expense reporting</li>
<li>Tax documentation</li>
<li>Reimbursement requests</li>
</ul>', 
N'Payments', 4, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(15, N'What fees does Planbeau charge?', 
N'<p>We believe in complete transparency about our fees. Here''s a detailed breakdown of all costs.</p>

<h2>For Clients</h2>

<h3>Processing Fee</h3>
<p>A small fee (~5%) is added to cover secure payment processing.</p>

<h3>Example Price Breakdown</h3>
<table>
<tr><th>Item</th><th>Amount</th></tr>
<tr><td>Vendor Service Price</td><td>$1,000.00</td></tr>
<tr><td>Processing Fee (5%)</td><td>$50.00</td></tr>
<tr><td>Subtotal</td><td>$1,050.00</td></tr>
<tr><td>HST (13% - Ontario)</td><td>$136.50</td></tr>
<tr><td><strong>Total</strong></td><td><strong>$1,186.50</strong></td></tr>
</table>

<h2>For Vendors</h2>

<h3>Commission</h3>
<p>Vendors pay a <strong>15% commission</strong> on completed bookings.</p>

<h3>Example Vendor Payout</h3>
<table>
<tr><th>Item</th><th>Amount</th></tr>
<tr><td>Your Service Price</td><td>$1,000.00</td></tr>
<tr><td>Planbeau Commission (15%)</td><td>-$150.00</td></tr>
<tr><td><strong>Your Payout</strong></td><td><strong>$850.00</strong></td></tr>
</table>

<h2>What''s Included</h2>
<p>The fees cover:</p>
<ul>
<li>Secure payment processing</li>
<li>Platform access and features</li>
<li>Customer support</li>
<li>Marketing and promotion</li>
<li>Fraud protection</li>
</ul>

<h2>No Hidden Fees</h2>
<p>There are no subscription fees, listing fees, monthly charges, or setup costs.</p>', 
N'Payments', 5, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(16, N'How are taxes calculated on my booking?', 
N'<p>Taxes are calculated based on your location (province/territory). This guide explains how Canadian taxes apply to your bookings.</p>

<h2>Tax Rates by Province</h2>
<table>
<tr><th>Province/Territory</th><th>Tax Rate</th><th>Tax Type</th></tr>
<tr><td>Alberta</td><td>5%</td><td>GST</td></tr>
<tr><td>British Columbia</td><td>12%</td><td>GST + PST</td></tr>
<tr><td>Manitoba</td><td>12%</td><td>GST + PST</td></tr>
<tr><td>New Brunswick</td><td>15%</td><td>HST</td></tr>
<tr><td>Newfoundland and Labrador</td><td>15%</td><td>HST</td></tr>
<tr><td>Northwest Territories</td><td>5%</td><td>GST</td></tr>
<tr><td>Nova Scotia</td><td>15%</td><td>HST</td></tr>
<tr><td>Nunavut</td><td>5%</td><td>GST</td></tr>
<tr><td>Ontario</td><td>13%</td><td>HST</td></tr>
<tr><td>Prince Edward Island</td><td>15%</td><td>HST</td></tr>
<tr><td>Quebec</td><td>14.975%</td><td>GST + QST</td></tr>
<tr><td>Saskatchewan</td><td>11%</td><td>GST + PST</td></tr>
<tr><td>Yukon</td><td>5%</td><td>GST</td></tr>
</table>

<h2>How Tax is Applied</h2>
<ol>
<li>Your location is determined from your profile or event address</li>
<li>The appropriate tax rate is applied to your subtotal</li>
<li>Tax is shown clearly in your payment breakdown</li>
<li>Tax appears on your invoice for record keeping</li>
</ol>

<h2>Tax on Your Invoice</h2>
<p>Your invoice includes a detailed tax breakdown showing the tax type and amount for your records.</p>', 
N'Payments', 6, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 11-16 (Payments)';
GO

-- =============================================
-- CANCELLATIONS & REFUNDS (IDs 17-21)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(17, N'What is the cancellation policy?', 
N'<p>Cancellation policies vary by vendor and are displayed on their profile before booking. This guide explains how cancellation policies work.</p>

<h2>Types of Cancellation Policies</h2>

<h3>Flexible Policy</h3>
<ul>
<li>Full refund up to <strong>24 hours</strong> before the event</li>
<li>Best for clients who need flexibility</li>
</ul>

<h3>Moderate Policy</h3>
<ul>
<li>Full refund up to <strong>7 days</strong> before the event</li>
<li>50% refund within 7 days</li>
<li>Balance between flexibility and vendor protection</li>
</ul>

<h3>Strict Policy</h3>
<ul>
<li>Full refund up to <strong>14 days</strong> before the event</li>
<li>50% refund within 14 days</li>
<li>No refund within 48 hours</li>
</ul>

<h2>Where to Find the Policy</h2>
<ol>
<li>Go to the vendor''s profile</li>
<li>Look for <strong>"Cancellation Policy"</strong> section</li>
<li>Review the terms before booking</li>
<li>The policy is also shown during checkout</li>
</ol>

<h2>Important Notes</h2>
<ul>
<li>Always review the policy before booking</li>
<li>Policies are set by individual vendors</li>
<li>Processing fees may be non-refundable</li>
<li>Special circumstances may be considered on a case-by-case basis</li>
</ul>', 
N'Cancellations', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(18, N'How do I cancel a booking?', 
N'<p>If you need to cancel a booking, follow these steps. Remember to review the cancellation policy first to understand any refund implications.</p>

<h2>Step-by-Step Cancellation Process</h2>

<h3>Step 1: Access Your Booking</h3>
<ol>
<li>Log in to your Planbeau account</li>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Bookings"</strong> in the sidebar</li>
<li>Find the booking you want to cancel</li>
</ol>

<h3>Step 2: Review Cancellation Terms</h3>
<ol>
<li>Click on the booking to view details</li>
<li>Review the <strong>cancellation policy</strong></li>
<li>Check the <strong>refund amount</strong> you''ll receive based on timing</li>
</ol>

<h3>Step 3: Submit Cancellation</h3>
<ol>
<li>Click the <strong>"Cancel Booking"</strong> button</li>
<li>Select a <strong>reason for cancellation</strong> from the dropdown</li>
<li>Add any additional notes (optional)</li>
<li>Confirm you understand the refund terms</li>
<li>Click <strong>"Confirm Cancellation"</strong></li>
</ol>

<h3>Step 4: Receive Confirmation</h3>
<ul>
<li>You''ll see a confirmation message on screen</li>
<li>An email confirmation will be sent</li>
<li>The vendor is notified automatically</li>
<li>Your refund (if applicable) will be processed</li>
</ul>

<h2>Refund Timeline</h2>
<p>Refunds are typically processed within <strong>5-10 business days</strong> after cancellation approval.</p>

<h2>Before You Cancel</h2>
<p>Consider these alternatives:</p>
<ul>
<li><strong>Modify the booking:</strong> Change the date instead of canceling</li>
<li><strong>Message the vendor:</strong> Discuss options before canceling</li>
<li><strong>Transfer the booking:</strong> Some vendors allow transfers to another person</li>
</ul>', 
N'Cancellations', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(19, N'How long do refunds take to process?', 
N'<p>Refund timing depends on several factors. This guide explains what to expect.</p>

<h2>Refund Timeline</h2>

<h3>Step 1: Cancellation Approved</h3>
<p>Once your cancellation is confirmed, the refund process begins immediately.</p>

<h3>Step 2: Planbeau Processing</h3>
<p>We initiate the refund within <strong>1-2 business days</strong>.</p>

<h3>Step 3: Bank Processing</h3>
<p>Your bank or credit card company processes the refund. This typically takes <strong>5-10 business days</strong>.</p>

<h2>Total Expected Timeline</h2>
<table>
<tr><th>Stage</th><th>Timeline</th></tr>
<tr><td>Cancellation approval</td><td>Immediate to 24 hours</td></tr>
<tr><td>Planbeau processing</td><td>1-2 business days</td></tr>
<tr><td>Bank processing</td><td>5-10 business days</td></tr>
<tr><td><strong>Total</strong></td><td><strong>5-14 business days</strong></td></tr>
</table>

<h2>Checking Refund Status</h2>
<ol>
<li>Go to <strong>Dashboard → Bookings</strong></li>
<li>Find your cancelled booking</li>
<li>View the refund status in the booking details</li>
</ol>

<h2>Refund Not Received?</h2>
<p>If your refund hasn''t arrived after 14 business days:</p>
<ol>
<li>Check your bank statement for the original charge</li>
<li>Contact your bank to inquire about pending credits</li>
<li>If still not resolved, contact support@planbeau.com</li>
</ol>', 
N'Cancellations', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(20, N'What if the vendor cancels on me?', 
N'<p>If a vendor cancels your booking, you''re protected. Here''s what happens and what you can expect.</p>

<h2>Immediate Actions</h2>
<ul>
<li>You''ll receive an <strong>immediate notification</strong> via email and in-app</li>
<li>Your booking status changes to <strong>"Cancelled by Vendor"</strong></li>
<li>A <strong>full refund</strong> is automatically initiated</li>
</ul>

<h2>Your Refund</h2>
<p>When a vendor cancels:</p>
<ul>
<li>You receive a <strong>100% refund</strong> of your payment</li>
<li>This includes the service price and processing fee</li>
<li>Refund is processed within <strong>5-10 business days</strong></li>
</ul>

<h2>Finding a Replacement Vendor</h2>
<p>We''ll help you find an alternative:</p>
<ol>
<li>Check our <strong>suggested similar vendors</strong> in the notification</li>
<li>Use the <strong>availability filter</strong> to find vendors for your date</li>
<li>Contact our support team for personalized recommendations</li>
</ol>

<h2>Vendor Accountability</h2>
<p>Vendors who cancel frequently face consequences:</p>
<ul>
<li>Lower search ranking</li>
<li>Warning notices on their profile</li>
<li>Potential suspension from the platform</li>
</ul>

<p>We take vendor reliability seriously to protect our clients.</p>', 
N'Cancellations', 4, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(21, N'Can I get a refund if I''m unsatisfied with the service?', 
N'<p>If you''re unsatisfied with a vendor''s service, we''re here to help. This guide explains your options.</p>

<h2>Step 1: Contact the Vendor First</h2>
<ol>
<li>Message the vendor through Planbeau</li>
<li>Clearly explain your concerns</li>
<li>Give them an opportunity to address the issue</li>
<li>Many issues can be resolved directly</li>
</ol>

<h2>Step 2: Contact Planbeau Support</h2>
<p>If you can''t resolve the issue with the vendor:</p>
<ol>
<li>Contact us within <strong>48 hours</strong> of your event</li>
<li>Email support@planbeau.com with details</li>
<li>Include your booking number</li>
<li>Describe the issue and what resolution you''re seeking</li>
<li>Attach any relevant photos or documentation</li>
</ol>

<h2>Our Review Process</h2>
<ol>
<li>We review your complaint and the vendor''s response</li>
<li>We may request additional information from both parties</li>
<li>We make a fair determination based on the evidence</li>
<li>You''ll be notified of the outcome</li>
</ol>

<h2>Possible Outcomes</h2>
<ul>
<li><strong>Full refund:</strong> If the vendor significantly failed to deliver</li>
<li><strong>Partial refund:</strong> If some services were delivered but not all</li>
<li><strong>No refund:</strong> If services were delivered as described</li>
<li><strong>Mediated resolution:</strong> Vendor offers alternative compensation</li>
</ul>

<h2>Documentation Tips</h2>
<p>To support your case, keep records of:</p>
<ul>
<li>All messages with the vendor</li>
<li>Photos or videos from the event</li>
<li>The original service description and contract</li>
<li>Any written agreements or changes</li>
</ul>', 
N'Cancellations', 5, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 17-21 (Cancellations)';
GO

-- =============================================
-- FOR VENDORS (IDs 22-27)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(22, N'How do I become a vendor on Planbeau?', 
N'<p>Join Planbeau as a vendor and connect with clients looking for your services. This guide walks you through the registration process.</p>

<h2>Step 1: Start Your Application</h2>
<ol>
<li>Visit <strong>planbeau.com</strong></li>
<li>Click <strong>"Become a Vendor"</strong> in the navigation</li>
<li>Click <strong>"Get Started"</strong> or <strong>"Apply Now"</strong></li>
</ol>

<h2>Step 2: Create Your Account</h2>
<ol>
<li>Enter your email address</li>
<li>Create a password</li>
<li>Enter your name</li>
<li>Verify your email address</li>
</ol>

<h2>Step 3: Complete Your Business Profile</h2>
<ol>
<li>Enter your <strong>business name</strong></li>
<li>Select your <strong>service category</strong> (Photography, Catering, DJ, etc.)</li>
<li>Add your <strong>business address</strong> and service areas</li>
<li>Upload your <strong>business logo</strong></li>
<li>Write your <strong>business description</strong></li>
</ol>

<h2>Step 4: Build Your Portfolio</h2>
<ol>
<li>Upload <strong>high-quality photos</strong> of your work (minimum 10 recommended)</li>
<li>Add <strong>videos</strong> if applicable</li>
<li>Organize into <strong>albums</strong> by event type</li>
</ol>

<h2>Step 5: Set Up Services & Pricing</h2>
<ol>
<li>Create <strong>service packages</strong> with descriptions</li>
<li>Set your <strong>pricing</strong> for each package</li>
<li>Define what''s <strong>included</strong> in each package</li>
<li>Add any <strong>add-on services</strong></li>
</ol>

<h2>Step 6: Connect Payment</h2>
<ol>
<li>Connect your <strong>Stripe account</strong> for payouts</li>
<li>Enter your banking information</li>
<li>Verify your identity</li>
</ol>

<h2>Step 7: Submit for Review</h2>
<p>Our team reviews your application within <strong>1-3 business days</strong>. Once approved, your profile goes live!</p>', 
N'Vendors', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(23, N'How much commission does Planbeau charge vendors?', 
N'<p>Planbeau charges a commission on completed bookings. Here''s everything you need to know about our fee structure.</p>

<h2>Commission Rate</h2>
<p>Planbeau charges a <strong>15% commission</strong> on completed bookings.</p>

<h2>How It Works</h2>
<ol>
<li>You set your own service prices</li>
<li>Client books and pays through Planbeau</li>
<li>You complete the service</li>
<li>Planbeau deducts 15% commission</li>
<li>Remaining 85% is transferred to your bank</li>
</ol>

<h2>Example Calculation</h2>
<table>
<tr><th>Item</th><th>Amount</th></tr>
<tr><td>Your Service Price</td><td>$1,000.00</td></tr>
<tr><td>Planbeau Commission (15%)</td><td>-$150.00</td></tr>
<tr><td><strong>Your Payout</strong></td><td><strong>$850.00</strong></td></tr>
</table>

<h2>What''s Included</h2>
<p>The 15% commission covers:</p>
<ul>
<li>Access to our client marketplace</li>
<li>Secure payment processing</li>
<li>Booking management tools</li>
<li>Messaging system</li>
<li>Review and rating system</li>
<li>Calendar management</li>
<li>Marketing and promotion</li>
<li>Customer support</li>
<li>Fraud protection</li>
</ul>

<h2>No Other Fees</h2>
<p>There are no subscription fees, listing fees, or monthly charges. You only pay when you earn.</p>', 
N'Vendors', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(24, N'How and when do vendors get paid?', 
N'<p>Understanding the payout process helps you manage your business finances. Here''s how vendor payments work.</p>

<h2>Payout Timeline</h2>
<ol>
<li><strong>Service completed:</strong> After you deliver your service</li>
<li><strong>Payout initiated:</strong> Within 24-48 hours of completion</li>
<li><strong>Bank processing:</strong> 2-7 business days depending on your bank</li>
</ol>

<h2>How Payouts Work</h2>
<ol>
<li>Client pays when booking is confirmed</li>
<li>Funds are held securely by Stripe</li>
<li>After service completion, payout is released</li>
<li>Commission is automatically deducted</li>
<li>Net amount is transferred to your bank</li>
</ol>

<h2>Viewing Your Payouts</h2>
<ol>
<li>Go to your <strong>Vendor Dashboard</strong></li>
<li>Click on <strong>"Payouts"</strong> or <strong>"Earnings"</strong></li>
<li>View pending, processing, and completed payouts</li>
<li>Download payout reports for accounting</li>
</ol>

<h2>Payout Methods</h2>
<p>Payouts are sent via <strong>direct bank deposit</strong> through Stripe. You''ll need to connect your bank account during setup.</p>

<h2>Minimum Payout</h2>
<p>There is no minimum payout amount. All earnings are transferred according to the standard schedule.</p>', 
N'Vendors', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(25, N'How do I manage my availability and calendar?', 
N'<p>Keeping your availability up-to-date helps you avoid double bookings and shows clients when you''re available.</p>

<h2>Accessing Your Calendar</h2>
<ol>
<li>Go to your <strong>Vendor Dashboard</strong></li>
<li>Click on <strong>"Availability"</strong> or <strong>"Calendar"</strong></li>
</ol>

<h2>Setting Your Availability</h2>

<h3>Regular Business Hours</h3>
<ol>
<li>Click <strong>"Set Business Hours"</strong></li>
<li>Select your available days</li>
<li>Set start and end times for each day</li>
<li>Save your settings</li>
</ol>

<h3>Blocking Dates</h3>
<ol>
<li>Click on a date in the calendar</li>
<li>Select <strong>"Block Date"</strong></li>
<li>Add a reason (optional)</li>
<li>The date will show as unavailable to clients</li>
</ol>

<h3>Syncing External Calendars</h3>
<ol>
<li>Go to <strong>"Calendar Settings"</strong></li>
<li>Click <strong>"Connect Calendar"</strong></li>
<li>Choose Google Calendar, iCal, or Outlook</li>
<li>Authorize the connection</li>
<li>Events from your external calendar will block availability</li>
</ol>

<h2>Automatic Updates</h2>
<p>When you accept a booking, that date/time is automatically blocked on your calendar.</p>

<h2>Tips for Managing Availability</h2>
<ul>
<li>Update your calendar regularly</li>
<li>Block personal commitments and vacations</li>
<li>Sync with your personal calendar to avoid conflicts</li>
<li>Set buffer time between bookings if needed</li>
</ul>', 
N'Vendors', 4, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(26, N'How do I respond to booking requests?', 
N'<p>Responding promptly to booking requests helps you win more clients. Here''s how to manage incoming requests.</p>

<h2>Receiving Requests</h2>
<p>When a client submits a booking request, you''ll receive:</p>
<ul>
<li>An <strong>email notification</strong></li>
<li>An <strong>in-app notification</strong></li>
<li>The request appears in your <strong>Dashboard → Bookings</strong></li>
</ul>

<h2>Reviewing a Request</h2>
<ol>
<li>Go to <strong>Vendor Dashboard → Bookings</strong></li>
<li>Click on the pending request</li>
<li>Review the details: date, time, package, client notes</li>
<li>Check your availability for that date</li>
</ol>

<h2>Responding Options</h2>

<h3>Option 1: Approve</h3>
<ol>
<li>Click <strong>"Approve"</strong> or <strong>"Accept"</strong></li>
<li>Add any notes for the client (optional)</li>
<li>Confirm your approval</li>
<li>Client is notified to complete payment</li>
</ol>

<h3>Option 2: Decline</h3>
<ol>
<li>Click <strong>"Decline"</strong></li>
<li>Select a reason from the dropdown</li>
<li>Add a personalized message (recommended)</li>
<li>Confirm the decline</li>
</ol>

<h3>Option 3: Request More Information</h3>
<ol>
<li>Click <strong>"Message Client"</strong></li>
<li>Ask your questions</li>
<li>Wait for their response before deciding</li>
</ol>

<h2>Response Deadline</h2>
<p>You have <strong>48 hours</strong> to respond to booking requests. Requests expire if not responded to in time.</p>

<h2>Tips for Better Response Rates</h2>
<ul>
<li>Respond within 24 hours (faster is better)</li>
<li>Personalize your responses</li>
<li>Be professional and friendly</li>
<li>If declining, suggest alternatives if possible</li>
</ul>', 
N'Vendors', 5, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(27, N'How can I improve my visibility and get more bookings?', 
N'<p>Stand out from the competition and attract more clients with these proven strategies.</p>

<h2>Optimize Your Profile</h2>
<ul>
<li><strong>Complete all sections:</strong> Profiles with 100% completion rank higher</li>
<li><strong>Write a compelling bio:</strong> Tell your story and what makes you unique</li>
<li><strong>Use keywords:</strong> Include terms clients search for</li>
<li><strong>Add your service areas:</strong> Be found by local clients</li>
</ul>

<h2>Showcase Your Best Work</h2>
<ul>
<li><strong>Upload high-quality photos:</strong> Minimum 10, ideally 20+</li>
<li><strong>Show variety:</strong> Different events, styles, and settings</li>
<li><strong>Update regularly:</strong> Add new work from recent events</li>
<li><strong>Add videos:</strong> If applicable to your service</li>
</ul>

<h2>Build Your Reputation</h2>
<ul>
<li><strong>Deliver excellent service:</strong> Happy clients leave great reviews</li>
<li><strong>Ask for reviews:</strong> Follow up after events</li>
<li><strong>Respond to reviews:</strong> Thank clients and address concerns</li>
<li><strong>Maintain high ratings:</strong> Aim for 4.5+ stars</li>
</ul>

<h2>Be Responsive</h2>
<ul>
<li><strong>Respond quickly:</strong> Under 24 hours, ideally within a few hours</li>
<li><strong>Answer thoroughly:</strong> Address all client questions</li>
<li><strong>Be professional:</strong> First impressions matter</li>
</ul>

<h2>Competitive Pricing</h2>
<ul>
<li><strong>Research competitors:</strong> Know the market rates</li>
<li><strong>Offer value:</strong> Clear packages with transparent pricing</li>
<li><strong>Consider promotions:</strong> Seasonal discounts or package deals</li>
</ul>

<h2>Enable Instant Book</h2>
<p>Vendors with Instant Book enabled often get more bookings because clients can confirm immediately.</p>', 
N'Vendors', 6, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 22-27 (Vendors)';
GO

-- =============================================
-- ACCOUNT & PROFILE (IDs 28-32)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(28, N'How do I update my profile information?', 
N'<p>Keep your profile up-to-date to ensure the best experience on Planbeau.</p>

<h2>Accessing Profile Settings</h2>
<ol>
<li>Log in to your Planbeau account</li>
<li>Click on your <strong>profile icon</strong> in the top-right corner</li>
<li>Select <strong>"Settings"</strong> or <strong>"Edit Profile"</strong></li>
</ol>

<h2>What You Can Update</h2>

<h3>Personal Information</h3>
<ul>
<li>Name</li>
<li>Profile photo</li>
<li>Phone number</li>
<li>Location</li>
</ul>

<h3>Account Settings</h3>
<ul>
<li>Email address</li>
<li>Password</li>
<li>Notification preferences</li>
<li>Privacy settings</li>
</ul>

<h2>Saving Changes</h2>
<ol>
<li>Make your desired changes</li>
<li>Click <strong>"Save Changes"</strong> or <strong>"Update"</strong></li>
<li>You''ll see a confirmation message</li>
</ol>

<h2>For Vendors</h2>
<p>Vendors have additional profile sections:</p>
<ul>
<li>Business information</li>
<li>Portfolio and gallery</li>
<li>Services and pricing</li>
<li>Availability calendar</li>
<li>Payment settings</li>
</ul>', 
N'Account', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(29, N'How do I change my password?', 
N'<p>Keep your account secure by using a strong password and changing it periodically.</p>

<h2>Changing Your Password</h2>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Settings"</strong></li>
<li>Select <strong>"Security"</strong> or <strong>"Password"</strong></li>
<li>Enter your <strong>current password</strong></li>
<li>Enter your <strong>new password</strong></li>
<li>Confirm your new password</li>
<li>Click <strong>"Update Password"</strong></li>
</ol>

<h2>Password Requirements</h2>
<ul>
<li>Minimum 8 characters</li>
<li>At least one number</li>
<li>We recommend including uppercase, lowercase, and special characters</li>
</ul>

<h2>Forgot Your Password?</h2>
<ol>
<li>Go to the login page</li>
<li>Click <strong>"Forgot Password"</strong></li>
<li>Enter your email address</li>
<li>Check your email for a reset link</li>
<li>Click the link and create a new password</li>
</ol>

<h2>Security Tips</h2>
<ul>
<li>Use a unique password for Planbeau</li>
<li>Don''t share your password with anyone</li>
<li>Change your password if you suspect unauthorized access</li>
<li>Consider using a password manager</li>
</ul>', 
N'Account', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(30, N'How do I manage my notification preferences?', 
N'<p>Control which notifications you receive and how you receive them.</p>

<h2>Accessing Notification Settings</h2>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Settings"</strong></li>
<li>Select <strong>"Notifications"</strong></li>
</ol>

<h2>Notification Types</h2>

<h3>Email Notifications</h3>
<ul>
<li>Booking requests and updates</li>
<li>Payment confirmations</li>
<li>Messages from vendors/clients</li>
<li>Review reminders</li>
<li>Promotional offers</li>
</ul>

<h3>In-App Notifications</h3>
<ul>
<li>Real-time booking updates</li>
<li>New messages</li>
<li>Important alerts</li>
</ul>

<h3>SMS Notifications (Optional)</h3>
<ul>
<li>Urgent booking updates</li>
<li>Payment reminders</li>
</ul>

<h2>Customizing Preferences</h2>
<ol>
<li>Toggle each notification type on or off</li>
<li>Choose your preferred delivery method</li>
<li>Click <strong>"Save Preferences"</strong></li>
</ol>

<h2>Recommended Settings</h2>
<p>We recommend keeping these notifications enabled:</p>
<ul>
<li>Booking requests and confirmations</li>
<li>Payment notifications</li>
<li>Messages</li>
</ul>', 
N'Account', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(31, N'How do I delete my account?', 
N'<p>If you need to delete your Planbeau account, follow these steps. Please note that account deletion is permanent.</p>

<h2>Before You Delete</h2>
<p>Consider these important points:</p>
<ul>
<li>Account deletion is <strong>permanent and irreversible</strong></li>
<li>All your data will be removed</li>
<li>You''ll lose access to booking history and messages</li>
<li>Any pending bookings must be completed or cancelled first</li>
<li>Vendors: Outstanding payouts will still be processed</li>
</ul>

<h2>How to Delete Your Account</h2>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Settings"</strong></li>
<li>Scroll to <strong>"Account"</strong> section</li>
<li>Click <strong>"Delete Account"</strong></li>
<li>Read the warning message</li>
<li>Enter your password to confirm</li>
<li>Click <strong>"Permanently Delete Account"</strong></li>
</ol>

<h2>What Gets Deleted</h2>
<ul>
<li>Your profile and personal information</li>
<li>Booking history</li>
<li>Messages and conversations</li>
<li>Reviews you''ve written</li>
<li>Saved favorites</li>
<li>For vendors: Your business profile and portfolio</li>
</ul>

<h2>Alternatives to Deletion</h2>
<p>Consider these options instead:</p>
<ul>
<li><strong>Pause notifications:</strong> Turn off emails if you need a break</li>
<li><strong>Deactivate temporarily:</strong> Contact support to pause your account</li>
<li><strong>Update preferences:</strong> Adjust settings to reduce communications</li>
</ul>', 
N'Account', 4, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(32, N'Why can''t I log into my account?', 
N'<p>Having trouble logging in? Here are common issues and solutions.</p>

<h2>Common Login Issues</h2>

<h3>Incorrect Password</h3>
<ol>
<li>Make sure Caps Lock is off</li>
<li>Try typing your password in a text editor first to check</li>
<li>Click <strong>"Forgot Password"</strong> to reset</li>
</ol>

<h3>Wrong Email Address</h3>
<ul>
<li>Check for typos in your email</li>
<li>Try other email addresses you might have used</li>
<li>If you signed up with Google, use "Sign in with Google"</li>
</ul>

<h3>Account Not Verified</h3>
<ul>
<li>Check your email for the verification link</li>
<li>Check spam/junk folder</li>
<li>Request a new verification email</li>
</ul>

<h3>Browser Issues</h3>
<ol>
<li>Clear your browser cache and cookies</li>
<li>Try a different browser</li>
<li>Disable browser extensions</li>
<li>Try incognito/private mode</li>
</ol>

<h2>Reset Your Password</h2>
<ol>
<li>Go to the login page</li>
<li>Click <strong>"Forgot Password"</strong></li>
<li>Enter your email address</li>
<li>Check your email for the reset link</li>
<li>Create a new password</li>
</ol>

<h2>Account Locked?</h2>
<p>After multiple failed login attempts, your account may be temporarily locked. Wait 30 minutes and try again, or contact support.</p>

<h2>Still Can''t Log In?</h2>
<p>Contact our support team at support@planbeau.com with:</p>
<ul>
<li>Your email address</li>
<li>Description of the issue</li>
<li>Any error messages you see</li>
</ul>', 
N'Account', 5, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 28-32 (Account)';
GO

-- =============================================
-- REVIEWS & RATINGS (IDs 33-36)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(33, N'How do I leave a review for a vendor?', 
N'<p>Your reviews help other clients make informed decisions and help vendors improve their services.</p>

<h2>When Can You Leave a Review?</h2>
<p>You can leave a review after your booking is marked as <strong>completed</strong>. You''ll receive an email reminder prompting you to share your experience.</p>

<h2>How to Leave a Review</h2>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Bookings"</strong></li>
<li>Find your completed booking</li>
<li>Click <strong>"Leave Review"</strong></li>
</ol>

<h2>What to Include</h2>

<h3>Star Rating (1-5)</h3>
<p>Rate your overall experience from 1 (poor) to 5 (excellent).</p>

<h3>Written Review</h3>
<p>Share details about your experience:</p>
<ul>
<li>Quality of service</li>
<li>Professionalism</li>
<li>Communication</li>
<li>Value for money</li>
<li>Would you recommend them?</li>
</ul>

<h3>Photos (Optional)</h3>
<p>Add photos from your event to show the vendor''s work.</p>

<h2>Review Guidelines</h2>
<ul>
<li>Be honest and fair</li>
<li>Focus on your actual experience</li>
<li>Be specific with examples</li>
<li>Keep it professional</li>
<li>No offensive language</li>
</ul>

<h2>Review Visibility</h2>
<p>Your review will be visible on the vendor''s profile. The vendor can respond publicly to your review.</p>', 
N'Reviews', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(34, N'Can I edit or delete my review?', 
N'<p>You can make changes to your review within a limited time period.</p>

<h2>Editing Your Review</h2>
<p>You can edit your review within <strong>14 days</strong> of posting:</p>
<ol>
<li>Go to <strong>Dashboard → Reviews</strong></li>
<li>Find the review you want to edit</li>
<li>Click <strong>"Edit"</strong></li>
<li>Make your changes</li>
<li>Click <strong>"Save"</strong></li>
</ol>

<h2>After 14 Days</h2>
<p>After 14 days, reviews become permanent to maintain authenticity and trust on the platform.</p>

<h2>Deleting a Review</h2>
<p>Reviews generally cannot be deleted once posted. However, you may request removal if:</p>
<ul>
<li>You posted on the wrong vendor by mistake</li>
<li>The review contains personal information you want removed</li>
<li>There are factual errors you can''t edit</li>
</ul>

<h2>To Request Removal</h2>
<ol>
<li>Contact support@planbeau.com</li>
<li>Include your booking number</li>
<li>Explain why you want the review removed</li>
<li>Our team will review your request</li>
</ol>

<h2>Vendor Disputes</h2>
<p>If a vendor disputes your review, our team may reach out to verify details. We don''t remove reviews simply because a vendor disagrees with them.</p>', 
N'Reviews', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(35, N'How are vendor ratings calculated?', 
N'<p>Understanding how ratings work helps you evaluate vendors effectively.</p>

<h2>Rating Calculation</h2>
<p>A vendor''s rating is the <strong>average of all review scores</strong> they''ve received.</p>

<h2>Rating Scale</h2>
<table>
<tr><th>Stars</th><th>Meaning</th></tr>
<tr><td>5 stars</td><td>Excellent</td></tr>
<tr><td>4 stars</td><td>Very Good</td></tr>
<tr><td>3 stars</td><td>Good</td></tr>
<tr><td>2 stars</td><td>Fair</td></tr>
<tr><td>1 star</td><td>Poor</td></tr>
</table>

<h2>What You See</h2>
<p>On vendor profiles, you''ll see:</p>
<ul>
<li><strong>Overall rating:</strong> Average score (e.g., 4.8)</li>
<li><strong>Number of reviews:</strong> Total reviews received</li>
<li><strong>Rating breakdown:</strong> Distribution of 1-5 star reviews</li>
</ul>

<h2>Recency Weighting</h2>
<p>Recent reviews have slightly more impact on the displayed rating, ensuring the score reflects current service quality.</p>

<h2>Verified Reviews Only</h2>
<p>Only clients who have completed a paid booking can leave reviews. This ensures all ratings come from genuine experiences.</p>

<h2>Tips for Evaluating Vendors</h2>
<ul>
<li>Look at the number of reviews, not just the rating</li>
<li>Read recent reviews for current quality</li>
<li>Look for patterns in feedback</li>
<li>Consider how the vendor responds to reviews</li>
</ul>', 
N'Reviews', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(36, N'Are reviews verified?', 
N'<p>Yes! Planbeau takes review authenticity seriously. Here''s how we ensure reviews are genuine.</p>

<h2>Verification Process</h2>
<ul>
<li>Only clients with <strong>completed, paid bookings</strong> can leave reviews</li>
<li>Reviews are linked to specific bookings</li>
<li>We verify the booking was fulfilled before enabling reviews</li>
<li>Each booking can only receive one review</li>
</ul>

<h2>What We Monitor</h2>
<ul>
<li>Suspicious patterns (multiple reviews from same IP)</li>
<li>Reviews that violate our guidelines</li>
<li>Fake or incentivized reviews</li>
<li>Reviews from non-customers</li>
</ul>

<h2>Prohibited Practices</h2>
<ul>
<li>Vendors cannot pay for positive reviews</li>
<li>Vendors cannot offer discounts for reviews</li>
<li>Fake accounts to leave reviews</li>
<li>Competitors leaving negative reviews</li>
</ul>

<h2>Reporting Suspicious Reviews</h2>
<p>If you suspect a review is fake or violates guidelines:</p>
<ol>
<li>Click the <strong>"Report"</strong> button on the review</li>
<li>Select the reason for reporting</li>
<li>Our team will investigate</li>
</ol>

<h2>Trust and Transparency</h2>
<p>Our verification system helps ensure you can trust the reviews you read when choosing vendors.</p>', 
N'Reviews', 4, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 33-36 (Reviews)';
GO

-- =============================================
-- MESSAGES & COMMUNICATION (IDs 37-40)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(37, N'How do I message a vendor?', 
N'<p>Communicating with vendors before and after booking is easy through our messaging system.</p>

<h2>Starting a Conversation</h2>
<ol>
<li>Go to the vendor''s profile</li>
<li>Click the <strong>"Message"</strong> button</li>
<li>Write your message</li>
<li>Click <strong>"Send"</strong></li>
</ol>

<h2>What to Ask Before Booking</h2>
<ul>
<li>Availability for your date</li>
<li>Specific service questions</li>
<li>Customization options</li>
<li>Experience with your event type</li>
<li>Any special requirements</li>
</ul>

<h2>Accessing Your Messages</h2>
<ol>
<li>Go to your <strong>Dashboard</strong></li>
<li>Click on <strong>"Messages"</strong></li>
<li>View all your conversations</li>
</ol>

<h2>Message Notifications</h2>
<p>You''ll receive notifications when you get a new message:</p>
<ul>
<li>Email notification</li>
<li>In-app notification</li>
<li>SMS (if enabled)</li>
</ul>

<h2>Response Times</h2>
<p>Most vendors respond within 24 hours. You can see their typical response time on their profile.</p>

<h2>Tips for Effective Communication</h2>
<ul>
<li>Be clear and specific</li>
<li>Include relevant details (date, location, requirements)</li>
<li>Ask all your questions at once</li>
<li>Be professional and courteous</li>
</ul>', 
N'Messages', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(38, N'How do I report inappropriate messages?', 
N'<p>If you receive inappropriate or spam messages, you can report them to our team.</p>

<h2>What to Report</h2>
<ul>
<li>Spam or promotional content</li>
<li>Harassment or threatening language</li>
<li>Requests to pay outside the platform</li>
<li>Inappropriate or offensive content</li>
<li>Scam attempts</li>
</ul>

<h2>How to Report</h2>
<ol>
<li>Open the conversation</li>
<li>Click the <strong>"..."</strong> menu or <strong>"Report"</strong> option</li>
<li>Select the reason for reporting</li>
<li>Add any additional details</li>
<li>Click <strong>"Submit Report"</strong></li>
</ol>

<h2>What Happens Next</h2>
<ol>
<li>Our team reviews the report</li>
<li>We investigate the conversation</li>
<li>Appropriate action is taken</li>
<li>You may be contacted for more information</li>
</ol>

<h2>Possible Actions</h2>
<ul>
<li>Warning to the user</li>
<li>Temporary suspension</li>
<li>Permanent ban from the platform</li>
</ul>

<h2>Protecting Yourself</h2>
<ul>
<li>Keep all communication on Planbeau</li>
<li>Never share personal financial information</li>
<li>Don''t agree to pay outside the platform</li>
<li>Report suspicious behavior immediately</li>
</ul>', 
N'Messages', 2, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 37-38 (Messages)';
GO

-- =============================================
-- TECHNICAL SUPPORT (IDs 39-42)
-- =============================================

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(39, N'The website isn''t loading properly. What should I do?', 
N'<p>If you''re experiencing issues with the website, try these troubleshooting steps.</p>

<h2>Quick Fixes</h2>
<ol>
<li><strong>Refresh the page:</strong> Press F5 or click the refresh button</li>
<li><strong>Clear cache:</strong> Clear your browser cache and cookies</li>
<li><strong>Try another browser:</strong> Chrome, Firefox, Safari, or Edge</li>
<li><strong>Disable extensions:</strong> Browser extensions can cause conflicts</li>
<li><strong>Check internet:</strong> Ensure you have a stable connection</li>
</ol>

<h2>Clear Browser Cache</h2>
<h3>Chrome</h3>
<ol>
<li>Press Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)</li>
<li>Select "Cached images and files"</li>
<li>Click "Clear data"</li>
</ol>

<h3>Firefox</h3>
<ol>
<li>Press Ctrl+Shift+Delete</li>
<li>Select "Cache"</li>
<li>Click "Clear Now"</li>
</ol>

<h2>Try Incognito Mode</h2>
<p>Open an incognito/private window to test without extensions or cached data.</p>

<h2>Check System Status</h2>
<p>Occasionally, we may have scheduled maintenance. Check our social media for updates.</p>

<h2>Still Having Issues?</h2>
<p>Contact support@planbeau.com with:</p>
<ul>
<li>Description of the problem</li>
<li>Browser and version</li>
<li>Device type (computer, phone, tablet)</li>
<li>Screenshots of any error messages</li>
</ul>', 
N'Technical', 1, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(40, N'I''m not receiving email notifications. How do I fix this?', 
N'<p>If you''re not receiving emails from Planbeau, follow these steps to troubleshoot.</p>

<h2>Check Spam/Junk Folder</h2>
<p>Emails sometimes get filtered. Check your spam folder for emails from:</p>
<ul>
<li>noreply@planbeau.com</li>
<li>support@planbeau.com</li>
<li>notifications@planbeau.com</li>
</ul>

<h2>Add to Contacts</h2>
<p>Add these email addresses to your contacts or safe senders list to prevent filtering.</p>

<h2>Check Notification Settings</h2>
<ol>
<li>Go to <strong>Dashboard → Settings → Notifications</strong></li>
<li>Ensure email notifications are <strong>enabled</strong></li>
<li>Check that specific notification types are turned on</li>
</ol>

<h2>Verify Your Email</h2>
<ol>
<li>Go to <strong>Dashboard → Settings → Account</strong></li>
<li>Confirm your email address is correct</li>
<li>If changed, verify the new email</li>
</ol>

<h2>Email Provider Settings</h2>
<p>Some email providers have strict filters. Check:</p>
<ul>
<li>Gmail: Check Promotions or Updates tabs</li>
<li>Outlook: Check Focused vs Other inbox</li>
<li>Yahoo: Check spam settings</li>
</ul>

<h2>Still Not Receiving Emails?</h2>
<p>Contact support@planbeau.com and we''ll investigate your account.</p>', 
N'Technical', 2, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(41, N'Which browsers are supported?', 
N'<p>Planbeau works best on modern, up-to-date browsers.</p>

<h2>Supported Browsers</h2>
<table>
<tr><th>Browser</th><th>Minimum Version</th><th>Recommended</th></tr>
<tr><td>Google Chrome</td><td>90+</td><td>Latest</td></tr>
<tr><td>Mozilla Firefox</td><td>88+</td><td>Latest</td></tr>
<tr><td>Apple Safari</td><td>14+</td><td>Latest</td></tr>
<tr><td>Microsoft Edge</td><td>90+</td><td>Latest</td></tr>
</table>

<h2>Mobile Browsers</h2>
<ul>
<li>Safari on iOS</li>
<li>Chrome on Android</li>
<li>Samsung Internet</li>
</ul>

<h2>Not Supported</h2>
<ul>
<li>Internet Explorer (discontinued)</li>
<li>Very old browser versions</li>
</ul>

<h2>Why Use Updated Browsers?</h2>
<ul>
<li>Better security</li>
<li>Improved performance</li>
<li>Access to all features</li>
<li>Bug fixes</li>
</ul>

<h2>How to Update Your Browser</h2>
<p>Most browsers update automatically. To check:</p>
<ul>
<li><strong>Chrome:</strong> Menu → Help → About Google Chrome</li>
<li><strong>Firefox:</strong> Menu → Help → About Firefox</li>
<li><strong>Safari:</strong> Updates with macOS/iOS</li>
<li><strong>Edge:</strong> Menu → Help and feedback → About Microsoft Edge</li>
</ul>', 
N'Technical', 3, 1, 0, 0, 0, 0);
GO

INSERT [admin].[FAQs] ([FAQID], [Question], [Answer], [Category], [DisplayOrder], [IsActive], [ViewCount], [HelpfulCount], [NeutralCount], [NotHelpfulCount]) VALUES 
(42, N'How do I contact Planbeau support?', 
N'<p>Our support team is here to help you with any questions or issues.</p>

<h2>Contact Methods</h2>

<h3>Email Support</h3>
<p><strong>support@planbeau.com</strong></p>
<p>Response time: Within 24-48 hours</p>

<h3>Help Centre</h3>
<p>Browse our comprehensive FAQ articles for instant answers to common questions.</p>

<h2>What to Include in Your Message</h2>
<p>To help us assist you faster, please include:</p>
<ul>
<li>Your account email address</li>
<li>Booking number (if applicable)</li>
<li>Detailed description of your issue</li>
<li>Screenshots of any error messages</li>
<li>Steps you''ve already tried</li>
</ul>

<h2>Support Hours</h2>
<p>Our team responds Monday through Friday, 9 AM - 6 PM EST. Messages received outside these hours will be addressed the next business day.</p>

<h2>Urgent Issues</h2>
<p>For urgent booking issues (within 24 hours of your event), please indicate "URGENT" in your email subject line.</p>

<h2>Feedback and Suggestions</h2>
<p>We love hearing from our users! Send feedback and feature suggestions to feedback@planbeau.com.</p>', 
N'Technical', 4, 1, 0, 0, 0, 0);
GO

PRINT 'Inserted FAQs 39-42 (Technical)';
GO

SET IDENTITY_INSERT [admin].[FAQs] OFF;
GO

PRINT 'All 42 comprehensive FAQ articles inserted successfully.';
GO
