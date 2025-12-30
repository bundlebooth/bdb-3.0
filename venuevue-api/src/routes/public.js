const express = require('express');
const router = express.Router();
const { poolPromise, sql } = require('../config/db');

// Default FAQs fallback
const DEFAULT_FAQS = [
  { FAQID: 1, Question: 'How do I book a vendor?', Answer: 'Browse vendors, select one, choose your date and complete the booking.', Category: 'Booking' },
  { FAQID: 2, Question: 'What is the cancellation policy?', Answer: 'Policies vary by vendor. Check the vendor profile for details.', Category: 'Booking' },
  { FAQID: 3, Question: 'How do payments work?', Answer: 'Payments are processed securely through Stripe.', Category: 'Payments' },
  { FAQID: 4, Question: 'How do I become a vendor?', Answer: 'Click Become a Vendor and complete the registration process.', Category: 'Vendors' }
];

// Default commission info fallback
const DEFAULT_COMMISSION = {
  platformCommission: '15',
  renterProcessingFee: '5',
  description: 'PlanBeau takes a 15% commission from the host\'s total payout. We also collect a 5% processing fee from the renter.'
};

// Get active announcements for homepage
router.get('/announcements', async (req, res) => {
  try {
    const { audience = 'all' } = req.query;
    const pool = await poolPromise;
    
    const result = await pool.request()
      .input('Audience', sql.NVarChar(50), audience)
      .execute('admin.sp_GetPublicAnnouncements');
    
    res.json({ announcements: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching public announcements:', error);
    res.json({ announcements: [] });
  }
});

// Get ALL announcements for What's New sidebar
router.get('/announcements/all', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetAllPublicAnnouncements');
    res.json({ announcements: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching all announcements:', error);
    res.json({ announcements: [] });
  }
});

// Get active banners for homepage
router.get('/banners', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicBanners');
    res.json({ banners: result.recordset || [] });
  } catch (error) {
    console.error('Error fetching public banners:', error);
    res.json({ banners: [] });
  }
});

// Dismiss announcement
router.post('/announcements/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await poolPromise;
    
    await pool.request()
      .input('AnnouncementID', sql.Int, parseInt(id))
      .execute('admin.sp_DismissPublicAnnouncement');
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error dismissing announcement:', error);
    res.status(500).json({ error: 'Failed to dismiss announcement' });
  }
});

// Get FAQs
router.get('/faqs', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicFAQs');
    
    if (result.recordset && result.recordset.length > 0) {
      res.json({ faqs: result.recordset });
    } else {
      res.json({ faqs: DEFAULT_FAQS });
    }
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.json({ faqs: DEFAULT_FAQS });
  }
});

// Submit FAQ feedback
router.post('/faqs/:id/feedback', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, rating } = req.body;
    
    const pool = await poolPromise;
    
    await pool.request()
      .input('FAQID', sql.Int, parseInt(id))
      .input('UserID', sql.Int, userId || null)
      .input('Rating', sql.NVarChar(20), rating)
      .execute('admin.sp_SubmitPublicFAQFeedback');
    
    res.json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    console.error('Error submitting FAQ feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

// Get commission info
router.get('/commission-info', async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().execute('admin.sp_GetPublicCommissionInfo');
    
    if (result.recordset && result.recordset.length > 0) {
      const settings = {};
      result.recordset.forEach(row => {
        settings[row.SettingKey] = {
          value: row.SettingValue,
          description: row.Description
        };
      });
      
      res.json({ 
        success: true,
        commissionInfo: {
          platformCommission: settings.platform_commission_rate?.value || DEFAULT_COMMISSION.platformCommission,
          renterProcessingFee: settings.renter_processing_fee_rate?.value || DEFAULT_COMMISSION.renterProcessingFee,
          description: 'PlanBeau takes a commission from the host\'s total payout. We also collect a processing fee from the renter to cover payment processing, platform development, customer support, and fraud prevention.'
        }
      });
    } else {
      res.json({ success: true, commissionInfo: DEFAULT_COMMISSION });
    }
  } catch (error) {
    console.error('Error fetching commission info:', error);
    res.json({ success: true, commissionInfo: DEFAULT_COMMISSION });
  }
});

module.exports = router;
