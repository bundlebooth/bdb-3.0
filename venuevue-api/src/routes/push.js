/**
 * Push Notification Routes
 * Handles push subscription management and notification sending
 */

const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotificationService');

// Get VAPID public key for client subscription
router.get('/vapid-public-key', (req, res) => {
  const publicKey = pushService.getVapidPublicKey();
  
  if (!publicKey) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured on server'
    });
  }
  
  res.json({ success: true, publicKey });
});

// Subscribe to push notifications
router.post('/subscribe', async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId or subscription'
      });
    }
    
    const result = await pushService.saveSubscription(userId, subscription);
    res.json(result);
  } catch (error) {
    console.error('[Push Routes] Subscribe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Unsubscribe from push notifications
router.post('/unsubscribe', async (req, res) => {
  try {
    const { userId, endpoint } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await pushService.removeSubscription(userId, endpoint);
    res.json(result);
  } catch (error) {
    console.error('[Push Routes] Unsubscribe error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send test notification (for development/testing)
router.post('/test', async (req, res) => {
  try {
    const { userId, title, body } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Missing userId'
      });
    }
    
    const result = await pushService.sendToUser(userId, {
      title: title || 'Test Notification',
      body: body || 'This is a test push notification from PlanBeau',
      url: '/dashboard'
    });
    
    res.json(result);
  } catch (error) {
    console.error('[Push Routes] Test notification error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
