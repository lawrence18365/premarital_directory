#!/usr/bin/env node

/**
 * Revenue Optimization System
 * Automates pricing, upsells, and revenue tracking
 */

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrandjdGxvbGhveGhub29zcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0MzI0OTgsImV4cCI6MjAzOTAwODQ5OH0.CfWiQCAMz6N4VjyqJP4ZmQ8LQ8wCYHhJWb_1NP4kI6A'
);

class RevenueOptimizer {
  constructor() {
    this.pricingTiers = {
      basic: {
        name: 'Basic Listing',
        price: 0,
        features: ['Basic profile', 'Contact form', 'Public listing'],
        limits: { photos: 1, specialties: 3 }
      },
      professional: {
        name: 'Professional',
        price: 49,
        features: ['Enhanced profile', 'Photo gallery', 'Lead analytics', 'Priority placement'],
        limits: { photos: 5, specialties: 10 }
      },
      premium: {
        name: 'Premium',
        price: 99,
        features: ['Featured placement', 'Unlimited photos', 'Advanced analytics', 'Social media integration'],
        limits: { photos: 'unlimited', specialties: 'unlimited' }
      }
    };
    
    this.upsellTriggers = {
      profile_views: 50,
      lead_inquiries: 5,
      days_active: 30
    };
  }

  // Set up automated pricing tiers
  async setupPricingTiers() {
    console.log('💰 Setting up pricing tiers...');
    
    for (const [key, tier] of Object.entries(this.pricingTiers)) {
      await supabase.from('subscription_plans').upsert({
        plan_id: key,
        name: tier.name,
        price: tier.price,
        billing_period: 'monthly',
        features: tier.features,
        limits: tier.limits,
        active: true
      });
      
      console.log(`✅ Created ${tier.name} plan: $${tier.price}/month`);
    }
  }

  // Implement automated upsell campaigns
  async runUpsellCampaigns() {
    console.log('📈 Running upsell campaigns...');
    
    // Find professionals eligible for upsells
    const { data: eligibleProfs } = await supabase
      .from('profiles')
      .select(`
        *,
        profile_analytics (
          views,
          lead_count,
          created_at
        )
      `)
      .eq('is_claimed', true)
      .eq('subscription_plan', 'basic');

    for (const prof of eligibleProfs || []) {
      const analytics = prof.profile_analytics?.[0];
      if (!analytics) continue;

      const daysSinceCreated = Math.floor(
        (new Date() - new Date(analytics.created_at)) / (1000 * 60 * 60 * 24)
      );

      // Check upsell triggers
      const shouldUpsell = 
        analytics.views >= this.upsellTriggers.profile_views ||
        analytics.lead_count >= this.upsellTriggers.lead_inquiries ||
        daysSinceCreated >= this.upsellTriggers.days_active;

      if (shouldUpsell) {
        await this.sendUpsellEmail(prof, analytics);
        
        // Log the upsell attempt
        await supabase.from('upsell_campaigns').insert({
          profile_id: prof.id,
          trigger_type: this.getUpsellTrigger(analytics, daysSinceCreated),
          campaign_sent: new Date().toISOString(),
          target_plan: 'professional'
        });
      }
    }
  }

  getUpsellTrigger(analytics, daysSinceCreated) {
    if (analytics.views >= this.upsellTriggers.profile_views) return 'high_views';
    if (analytics.lead_count >= this.upsellTriggers.lead_inquiries) return 'lead_threshold';
    if (daysSinceCreated >= this.upsellTriggers.days_active) return 'time_based';
    return 'manual';
  }

  async sendUpsellEmail(prof, analytics) {
    const emailData = {
      to: [prof.email],
      subject: this.generateUpsellSubject(prof, analytics),
      html: this.generateUpsellEmail(prof, analytics),
      from: 'success@weddingcounselors.com'
    };

    const response = await fetch('https://api.smtp2go.com/v3/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Smtp2go-Api-Key': process.env.SMTP2GO_API_KEY
      },
      body: JSON.stringify({
        api_key: process.env.SMTP2GO_API_KEY,
        to: [prof.email],
        sender: 'success@weddingcounselors.com',
        subject: emailData.subject,
        html_body: emailData.html
      })
    });

    const result = await response.json();
    console.log(`📧 Upsell email sent to ${prof.full_name}:`, result.request_id ? 'SUCCESS' : 'FAILED');
  }

  generateUpsellSubject(prof, analytics) {
    if (analytics.lead_count >= 5) {
      return `${prof.full_name}, you're getting lots of leads! Time to upgrade?`;
    } else if (analytics.views >= 50) {
      return `Your profile is popular! Maximize your visibility with Professional`;
    } else {
      return `Ready to grow your practice, ${prof.full_name.split(' ')[0]}?`;
    }
  }

  generateUpsellEmail(prof, analytics) {
    const firstName = prof.full_name.split(' ')[0];
    
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2c3e50;">Great news, ${firstName}! 🎉</h2>
      
      <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #27ae60; margin-top: 0;">Your WeddingCounselors.com Profile is Performing Well!</h3>
        
        <div style="display: flex; justify-content: space-between; margin: 15px 0;">
          <div style="text-align: center;">
            <strong style="font-size: 24px; color: #3498db;">${analytics.views}</strong><br>
            <span style="color: #7f8c8d;">Profile Views</span>
          </div>
          <div style="text-align: center;">
            <strong style="font-size: 24px; color: #e74c3c;">${analytics.lead_count}</strong><br>
            <span style="color: #7f8c8d;">Leads Generated</span>
          </div>
          <div style="text-align: center;">
            <strong style="font-size: 24px; color: #f39c12;">Basic</strong><br>
            <span style="color: #7f8c8d;">Current Plan</span>
          </div>
        </div>
      </div>

      <p>Based on your profile's performance, you're ready to take the next step and maximize your growth potential.</p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #2c3e50; margin-top: 0;">Upgrade to Professional and Get:</h3>
        <ul style="margin: 15px 0;">
          <li>🎯 <strong>Priority placement</strong> in search results</li>
          <li>📊 <strong>Advanced analytics</strong> to track your success</li>
          <li>📸 <strong>Photo gallery</strong> to showcase your practice</li>
          <li>💼 <strong>Enhanced profile</strong> with unlimited specialties</li>
          <li>📈 <strong>Lead tracking</strong> and follow-up tools</li>
        </ul>
      </div>

      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0;">Limited Time: 50% OFF First 3 Months!</h3>
        <p style="margin: 0 0 15px 0; opacity: 0.9;">Normally $49/month, now just $24.50/month</p>
        <a href="https://weddingcounselors.com/upgrade?promo=GROWTH50" 
           style="background: white; color: #667eea; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
          UPGRADE NOW - SAVE $73.50 →
        </a>
      </div>

      <div style="border-left: 4px solid #3498db; padding-left: 15px; margin: 20px 0;">
        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Success Story:</h4>
        <p style="margin: 0; font-style: italic; color: #7f8c8d;">
          "Since upgrading to Professional, I've seen a 300% increase in leads and booked 2 months out!" 
          - Sarah M., Licensed Therapist
        </p>
      </div>

      <p>Questions? Reply to this email or call (555) 123-4567 to speak with our success team.</p>
      
      <p>Ready to grow?<br>
      The WeddingCounselors.com Team</p>

      <hr style="margin: 30px 0;">
      <p style="font-size: 12px; color: #7f8c8d;">
        This upgrade offer expires in 7 days. 
        <a href="https://weddingcounselors.com/unsubscribe/${prof.id}">Unsubscribe</a>
      </p>
    </div>`;
  }

  // Implement dynamic pricing based on market demand
  async optimizePricing() {
    console.log('⚖️ Optimizing pricing based on demand...');
    
    // Analyze market metrics
    const { count: totalProfessionals } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: paidSubscriptions } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .neq('subscription_plan', 'basic');

    const conversionRate = (paidSubscriptions / totalProfessionals) * 100;
    
    // Adjust pricing based on conversion rate
    let priceMultiplier = 1;
    if (conversionRate > 15) {
      priceMultiplier = 1.1; // Increase prices if conversion is high
    } else if (conversionRate < 5) {
      priceMultiplier = 0.9; // Decrease prices if conversion is low
    }

    console.log(`📊 Market Analysis:
- Total Professionals: ${totalProfessionals}
- Paid Subscriptions: ${paidSubscriptions}
- Conversion Rate: ${conversionRate.toFixed(1)}%
- Price Adjustment: ${priceMultiplier > 1 ? '+' : ''}${((priceMultiplier - 1) * 100).toFixed(0)}%`);

    // Update pricing if significant change needed
    if (priceMultiplier !== 1) {
      const newProfessionalPrice = Math.round(this.pricingTiers.professional.price * priceMultiplier);
      const newPremiumPrice = Math.round(this.pricingTiers.premium.price * priceMultiplier);
      
      await supabase.from('subscription_plans')
        .update({ price: newProfessionalPrice })
        .eq('plan_id', 'professional');
        
      await supabase.from('subscription_plans')
        .update({ price: newPremiumPrice })
        .eq('plan_id', 'premium');
        
      console.log(`✅ Updated pricing: Professional $${newProfessionalPrice}, Premium $${newPremiumPrice}`);
    }
  }

  // Create referral program
  async setupReferralProgram() {
    console.log('🤝 Setting up referral program...');
    
    const referralRules = {
      referrer_reward: 25, // $25 credit for referrer
      referee_discount: 50, // 50% off first month for new user
      payout_threshold: 100, // Minimum $100 to cash out
      commission_rate: 0.1 // 10% recurring commission
    };

    await supabase.from('referral_program').upsert({
      id: 'default',
      rules: referralRules,
      active: true,
      created_at: new Date().toISOString()
    });

    console.log('✅ Referral program activated');
    console.log(`- Referrer gets $${referralRules.referrer_reward} credit per referral`);
    console.log(`- New users get ${referralRules.referee_discount}% off first month`);
    console.log(`- ${referralRules.commission_rate * 100}% recurring commission`);
  }

  // A/B test pricing pages
  async setupPricingTests() {
    console.log('🧪 Setting up A/B pricing tests...');
    
    const testVariants = [
      {
        name: 'Original',
        professional_price: 49,
        professional_cta: 'Start Professional Plan',
        emphasis: 'most_popular'
      },
      {
        name: 'Higher Value',
        professional_price: 69,
        professional_cta: 'Unlock Growth Features',
        emphasis: 'premium'
      },
      {
        name: 'Lower Barrier',
        professional_price: 39,
        professional_cta: 'Try Professional Risk-Free',
        emphasis: 'professional'
      }
    ];

    for (const variant of testVariants) {
      await supabase.from('pricing_tests').insert({
        variant_name: variant.name,
        config: variant,
        traffic_percentage: 33.33,
        active: true
      });
    }

    console.log('✅ A/B pricing tests configured');
  }

  // Generate revenue report
  async generateRevenueReport() {
    const { data: subscriptions } = await supabase
      .from('profiles')
      .select('subscription_plan, created_at')
      .neq('subscription_plan', 'basic');

    const monthlyRevenue = subscriptions?.reduce((total, sub) => {
      const planPrice = this.pricingTiers[sub.subscription_plan]?.price || 0;
      return total + planPrice;
    }, 0) || 0;

    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: claimedProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true);

    const paidCount = subscriptions?.length || 0;
    const conversionRate = totalProfiles > 0 ? (claimedProfiles / totalProfiles) * 100 : 0;
    const monetizationRate = claimedProfiles > 0 ? (paidCount / claimedProfiles) * 100 : 0;

    console.log(`
💰 REVENUE OPTIMIZATION REPORT
=============================
Monthly Recurring Revenue: $${monthlyRevenue.toLocaleString()}
Annual Run Rate: $${(monthlyRevenue * 12).toLocaleString()}

Conversion Funnel:
- Total Professionals: ${totalProfiles}
- Claimed Profiles: ${claimedProfiles} (${conversionRate.toFixed(1)}%)
- Paid Subscriptions: ${paidCount} (${monetizationRate.toFixed(1)}% of claimed)

Optimization Opportunities:
${conversionRate < 10 ? '⚠️  Low claim rate - improve activation emails' : '✅ Good claim rate'}
${monetizationRate < 20 ? '⚠️  Low monetization - improve upsell campaigns' : '✅ Good monetization rate'}
${monthlyRevenue < 5000 ? '📈 Focus on growth - target 100+ paid users' : '🎯 Optimize pricing and retention'}

Next Month Goal: $${(monthlyRevenue * 1.3).toLocaleString()} (+30%)
    `);

    return {
      monthlyRevenue,
      annualRunRate: monthlyRevenue * 12,
      totalProfiles,
      claimedProfiles,
      paidCount,
      conversionRate,
      monetizationRate
    };
  }

  // Main execution
  async run() {
    console.log('🚀 Starting Revenue Optimization System...\n');
    
    try {
      await this.setupPricingTiers();
      await this.runUpsellCampaigns();
      await this.optimizePricing();
      await this.setupReferralProgram();
      await this.setupPricingTests();
      await this.generateRevenueReport();
      
      console.log('\n✅ Revenue optimization system activated!');
      console.log('\nRecommended Actions:');
      console.log('1. Monitor upsell email performance');
      console.log('2. A/B test pricing variants');
      console.log('3. Launch referral program to existing users');
      console.log('4. Track conversion metrics weekly');
      
    } catch (error) {
      console.error('❌ Revenue optimization failed:', error);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new RevenueOptimizer();
  optimizer.run();
}

module.exports = RevenueOptimizer;