#!/usr/bin/env node

/**
 * Professional Activation Automation System
 * Finds emails, sends outreach, tracks responses
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrandjdGxvbGhveGhub29zcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE7MjM0MzI0OTgsImV4cCI6MjAzOTAwODQ5OH0.CfWiQCAMz6N4VjyqJP4ZmQ8LQ8wCYHhJWb_1NP4kI6A'
);

class ProfessionalActivator {
  constructor() {
    this.emailQueue = [];
    this.activationStats = {
      total: 0,
      withEmail: 0,
      emailsSent: 0,
      activationRate: 0
    };
  }

  // Find emails for professionals without them
  async findMissingEmails() {
    console.log('🔍 Finding missing emails...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .is('email', null)
      .limit(100);

    for (const profile of profiles || []) {
      const email = await this.searchForEmail(profile);
      if (email) {
        await supabase
          .from('profiles')
          .update({ email: email })
          .eq('id', profile.id);
        
        console.log(`✅ Found email for ${profile.full_name}: ${email}`);
      }
    }
  }

  // Search for professional's email using multiple methods
  async searchForEmail(profile) {
    const strategies = [
      () => this.tryCommonFormats(profile),
      () => this.searchPsychologyToday(profile),
      () => this.searchGoogle(profile)
    ];

    for (const strategy of strategies) {
      try {
        const email = await strategy();
        if (email && this.validateEmail(email)) {
          return email;
        }
      } catch (error) {
        console.log(`Strategy failed for ${profile.full_name}:`, error.message);
      }
    }
    return null;
  }

  // Try common email formats
  tryCommonFormats(profile) {
    if (!profile.website) return null;
    
    const domain = profile.website.replace(/https?:\/\//, '').replace(/\/$/, '');
    const firstName = profile.full_name.split(' ')[0].toLowerCase();
    const lastName = profile.full_name.split(' ').pop().toLowerCase();
    
    const formats = [
      `${firstName}@${domain}`,
      `${firstName}.${lastName}@${domain}`,
      `${firstName}_${lastName}@${domain}`,
      `${firstName}${lastName}@${domain}`,
      `info@${domain}`,
      `contact@${domain}`
    ];

    // Return first format for now (would need email verification service)
    return formats[0];
  }

  // Search Psychology Today (mock - would need scraping)
  async searchPsychologyToday(profile) {
    // Mock implementation - in reality you'd scrape PT profiles
    console.log(`Searching Psychology Today for ${profile.full_name}...`);
    return null;
  }

  // Search Google for contact info (mock)
  async searchGoogle(profile) {
    console.log(`Googling ${profile.full_name} ${profile.city}...`);
    return null;
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Send activation emails
  async sendActivationEmails() {
    console.log('📧 Sending activation emails...');
    
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .not('email', 'is', null)
      .eq('is_claimed', false)
      .limit(50); // Send 50 per day

    for (const profile of profiles || []) {
      await this.sendActivationEmail(profile);
      
      // Log the outreach
      await supabase.from('outreach_log').insert({
        profile_id: profile.id,
        email_type: 'activation',
        sent_at: new Date().toISOString(),
        email_address: profile.email
      });

      // Wait 1 second between emails
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async sendActivationEmail(profile) {
    const emailData = {
      to: [profile.email],
      subject: `${profile.full_name}, claim your FREE listing on WeddingCounselors.com`,
      html: this.generateActivationEmail(profile),
      from: 'info@weddingcounselors.com'
    };

    // Use your SMTP2GO setup
    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': process.env.SMTP2GO_API_KEY
      },
      body: JSON.stringify({
        api_key: process.env.SMTP2GO_API_KEY,
        to: [profile.email],
        sender: 'info@weddingcounselors.com',
        subject: emailData.subject,
        html_body: emailData.html
      })
    });

    const result = await response.json();
    console.log(`📧 Sent to ${profile.full_name}:`, result.request_id ? 'SUCCESS' : 'FAILED');
    
    return result;
  }

  generateActivationEmail(profile) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Hi ${profile.full_name.split(' ')[0]},</h2>
      
      <p>We found your professional profile and wanted to let you know about an exciting opportunity.</p>
      
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #27ae60; margin-top: 0;">Your FREE listing is waiting!</h3>
        <p><strong>WeddingCounselors.com</strong> is the premier directory for premarital counseling professionals.</p>
        
        <ul>
          <li>🎯 Connect with couples actively seeking counseling</li>
          <li>📈 Grow your practice with qualified leads</li>
          <li>✅ Verify your credentials and build trust</li>
          <li>💰 FREE basic listing (normally $49/month)</li>
        </ul>
      </div>

      <p><strong>Your current listing:</strong></p>
      <div style="border-left: 4px solid #3498db; padding-left: 15px; margin: 15px 0;">
        <strong>${profile.full_name}</strong><br>
        ${profile.profession || 'Professional Counselor'}<br>
        ${profile.city}, ${profile.state_province}<br>
        <em>Status: Unclaimed</em>
      </div>

      <div style="text-align: center; margin: 30px 0;">
        <a href="https://weddingcounselors.com/claim/${profile.id}" 
           style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
          CLAIM YOUR FREE LISTING →
        </a>
      </div>

      <p><strong>Limited time offer:</strong> Claim by August 30th and get:</p>
      <ul>
        <li>6 months premium features FREE</li>
        <li>Priority placement in search results</li>
        <li>Advanced lead tracking dashboard</li>
      </ul>

      <p>Questions? Reply to this email or call (555) 123-4567.</p>
      
      <p>Best regards,<br>
      The WeddingCounselors.com Team</p>

      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #7f8c8d;">
        You're receiving this because we found your professional information online. 
        <a href="https://weddingcounselors.com/unsubscribe/${profile.id}">Unsubscribe</a>
      </p>
    </div>`;
  }

  // Track activation metrics
  async generateReport() {
    const { count: total } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: withEmail } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .not('email', 'is', null);

    const { count: claimed } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true);

    const { count: emailsSent } = await supabase
      .from('outreach_log')
      .select('*', { count: 'exact', head: true });

    console.log(`
📊 ACTIVATION REPORT
==================
Total Profiles: ${total}
With Email: ${withEmail} (${((withEmail/total)*100).toFixed(1)}%)
Claimed: ${claimed} (${((claimed/total)*100).toFixed(1)}%)
Emails Sent: ${emailsSent}
Activation Rate: ${((claimed/emailsSent)*100).toFixed(1)}%
    `);

    return {
      total,
      withEmail,
      claimed,
      emailsSent,
      activationRate: (claimed/emailsSent)*100
    };
  }

  // Main execution
  async run() {
    console.log('🚀 Starting Professional Activation System...\n');
    
    try {
      await this.findMissingEmails();
      await this.sendActivationEmails();
      await this.generateReport();
    } catch (error) {
      console.error('❌ Activation failed:', error);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const activator = new ProfessionalActivator();
  activator.run();
}

module.exports = ProfessionalActivator;