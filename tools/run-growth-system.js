#!/usr/bin/env node

/**
 * Master Growth System Runner
 * Orchestrates all automation systems
 */

const ProfessionalActivator = require('./activate-professionals');
const LeadGenerator = require('./lead-generation-automation');
const RevenueOptimizer = require('./revenue-optimizer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL || 'https://bkjwctlolhoxhnoospwp.supabase.co',
  process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrandjdGxvbGhveGhub29zcHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjM0MzI0OTgsImV4cCI6MjAzOTAwODQ5OH0.CfWiQCAMz6N4VjyqJP4ZmQ8LQ8wCYHhJWb_1NP4kI6A'
);

class GrowthSystem {
  constructor() {
    this.activator = new ProfessionalActivator();
    this.leadGenerator = new LeadGenerator();
    this.revenueOptimizer = new RevenueOptimizer();
    
    this.schedule = {
      daily: ['sendActivationEmails', 'generateSocialPosts'],
      weekly: ['findMissingEmails', 'runUpsellCampaigns', 'generateLeadReport'],
      monthly: ['optimizePricing', 'generateRevenueReport']
    };
  }

  // Run daily automation tasks
  async runDaily() {
    console.log('🌅 Running daily automation tasks...\n');
    
    try {
      // Send activation emails (50 per day)
      console.log('1. Sending activation emails...');
      await this.activator.sendActivationEmails();
      
      // Generate and post social content
      console.log('\n2. Generating social posts...');
      await this.generateDailySocialContent();
      
      // Track daily metrics
      console.log('\n3. Tracking daily metrics...');
      await this.trackDailyMetrics();
      
      console.log('\n✅ Daily automation completed!');
      
    } catch (error) {
      console.error('❌ Daily automation failed:', error);
    }
  }

  // Run weekly automation tasks
  async runWeekly() {
    console.log('📅 Running weekly automation tasks...\n');
    
    try {
      // Find missing emails
      console.log('1. Finding missing emails...');
      await this.activator.findMissingEmails();
      
      // Run upsell campaigns
      console.log('\n2. Running upsell campaigns...');
      await this.revenueOptimizer.runUpsellCampaigns();
      
      // Generate lead report
      console.log('\n3. Generating lead report...');
      await this.leadGenerator.generateLeadReport();
      
      // Create new blog content
      console.log('\n4. Creating blog content...');
      await this.generateWeeklyBlogContent();
      
      console.log('\n✅ Weekly automation completed!');
      
    } catch (error) {
      console.error('❌ Weekly automation failed:', error);
    }
  }

  // Run monthly automation tasks
  async runMonthly() {
    console.log('📊 Running monthly automation tasks...\n');
    
    try {
      // Optimize pricing
      console.log('1. Optimizing pricing...');
      await this.revenueOptimizer.optimizePricing();
      
      // Generate comprehensive reports
      console.log('\n2. Generating monthly reports...');
      await this.generateMonthlyReport();
      
      // Plan next month's campaigns
      console.log('\n3. Planning next month...');
      await this.planNextMonth();
      
      console.log('\n✅ Monthly automation completed!');
      
    } catch (error) {
      console.error('❌ Monthly automation failed:', error);
    }
  }

  async generateDailySocialContent() {
    const socialPosts = [
      "💕 Did you know? Couples who attend premarital counseling have 30% lower divorce rates. Invest in your future together! #PremaritalCounseling #MarriagePrep",
      "🎯 5 Topics Every Engaged Couple Should Discuss:\n1. Financial goals\n2. Career priorities\n3. Family planning\n4. Communication styles\n5. Conflict resolution\n\nFind a counselor to guide these conversations! 💍",
      "💡 Marriage Tip: Start counseling BEFORE problems arise. Prevention is better than intervention! Find qualified counselors in your area. #RelationshipGoals",
      "📈 Success Story: 'Our premarital counselor helped us understand each other's love languages. Best investment we made!' - Sarah & Mike, married 3 years 💑"
    ];

    const randomPost = socialPosts[Math.floor(Math.random() * socialPosts.length)];
    
    // Log social post for manual posting (could integrate with social APIs)
    console.log('📱 Today\'s social post:');
    console.log(randomPost);
    
    // Save to database for tracking
    await supabase.from('social_posts').insert({
      content: randomPost,
      platform: 'facebook,instagram,twitter',
      scheduled_date: new Date().toISOString(),
      status: 'scheduled'
    });
  }

  async generateWeeklyBlogContent() {
    const blogTopics = [
      'How to Choose the Right Premarital Counselor',
      '10 Questions Every Engaged Couple Should Ask',
      'Financial Planning Before Marriage: A Complete Guide',
      'Communication Skills That Build Stronger Marriages',
      'Why Premarital Counseling Isn\'t Just for Troubled Couples'
    ];

    const randomTopic = blogTopics[Math.floor(Math.random() * blogTopics.length)];
    console.log(`📝 This week's blog topic: ${randomTopic}`);
    
    // Generate basic blog structure
    const blogPost = {
      title: randomTopic,
      slug: randomTopic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: 'Premarital Counseling',
      status: 'draft',
      target_publish: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    await supabase.from('content_calendar').insert(blogPost);
    console.log('✅ Blog post added to content calendar');
  }

  async trackDailyMetrics() {
    const today = new Date().toISOString().split('T')[0];
    
    // Get key metrics
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: claimedToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', true)
      .gte('updated_at', today);

    const { count: emailsSentToday } = await supabase
      .from('outreach_log')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today);

    // Save daily metrics
    await supabase.from('daily_metrics').insert({
      date: today,
      total_profiles: totalProfiles,
      profiles_claimed: claimedToday,
      emails_sent: emailsSentToday,
      metric_type: 'growth'
    });

    console.log(`📊 Daily metrics saved:
- Total Profiles: ${totalProfiles}
- Claimed Today: ${claimedToday}
- Emails Sent: ${emailsSentToday}`);
  }

  async generateMonthlyReport() {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { data: monthlyMetrics } = await supabase
      .from('daily_metrics')
      .select('*')
      .gte('date', startOfMonth.toISOString());

    const totalEmailsSent = monthlyMetrics?.reduce((sum, day) => sum + (day.emails_sent || 0), 0) || 0;
    const totalClaimed = monthlyMetrics?.reduce((sum, day) => sum + (day.profiles_claimed || 0), 0) || 0;

    // Get revenue data
    const revenueReport = await this.revenueOptimizer.generateRevenueReport();

    console.log(`
📈 MONTHLY GROWTH REPORT - ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
=====================================================

PROFESSIONAL ACTIVATION:
- Emails Sent: ${totalEmailsSent}
- Profiles Claimed: ${totalClaimed}
- Activation Rate: ${totalEmailsSent > 0 ? ((totalClaimed / totalEmailsSent) * 100).toFixed(1) : 0}%

REVENUE:
- Monthly Revenue: $${revenueReport.monthlyRevenue.toLocaleString()}
- Paid Subscriptions: ${revenueReport.paidCount}
- Conversion Rate: ${revenueReport.monetizationRate.toFixed(1)}%

GROWTH TRAJECTORY:
${revenueReport.monthlyRevenue < 1000 ? '🔥 Focus: Activate more professionals' : ''}
${revenueReport.monthlyRevenue >= 1000 && revenueReport.monthlyRevenue < 5000 ? '📈 Focus: Optimize conversion and pricing' : ''}
${revenueReport.monthlyRevenue >= 5000 ? '🚀 Focus: Scale and retention' : ''}
    `);
  }

  async planNextMonth() {
    const { count: totalProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: unclaimedProfiles } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_claimed', false);

    // Calculate targets for next month
    const emailTarget = Math.min(unclaimedProfiles, 1500); // 50 emails/day * 30 days
    const claimTarget = Math.ceil(emailTarget * 0.05); // 5% activation rate target
    const revenueTarget = claimTarget * 49 * 0.2; // 20% convert to paid at $49/month

    console.log(`
🎯 NEXT MONTH TARGETS
====================
Email Outreach: ${emailTarget} professionals
Activation Goal: ${claimTarget} claimed profiles
Revenue Target: $${revenueTarget.toLocaleString()}/month

ACTION PLAN:
1. Send ${Math.ceil(emailTarget / 30)} activation emails daily
2. Create ${Math.ceil(claimTarget / 4)} weekly blog posts
3. Launch targeted ads in top 10 cities
4. A/B test pricing and messaging
    `);

    // Save targets to database
    await supabase.from('monthly_targets').insert({
      month: new Date().toISOString().slice(0, 7), // YYYY-MM format
      email_target: emailTarget,
      claim_target: claimTarget,
      revenue_target: revenueTarget,
      created_at: new Date().toISOString()
    });
  }

  // Setup cron-like scheduling
  async setupScheduler() {
    console.log('⏰ Setting up automation scheduler...\n');
    
    console.log('AUTOMATION SCHEDULE:');
    console.log('==================');
    console.log('Daily (9 AM):');
    console.log('  - Send 50 activation emails');
    console.log('  - Generate social media content');
    console.log('  - Track daily metrics');
    console.log('');
    console.log('Weekly (Monday 9 AM):');
    console.log('  - Find missing professional emails');
    console.log('  - Run upsell campaigns');
    console.log('  - Create new blog content');
    console.log('  - Generate lead reports');
    console.log('');
    console.log('Monthly (1st of month):');
    console.log('  - Optimize pricing based on demand');
    console.log('  - Generate comprehensive reports');
    console.log('  - Plan next month targets');
    console.log('');
    
    // Save scheduler configuration
    await supabase.from('automation_schedule').upsert({
      id: 'master_schedule',
      daily_tasks: this.schedule.daily,
      weekly_tasks: this.schedule.weekly,
      monthly_tasks: this.schedule.monthly,
      active: true,
      last_updated: new Date().toISOString()
    });
    
    console.log('✅ Automation scheduler configured!');
    console.log('\nTo run automation:');
    console.log('- Daily: node tools/run-growth-system.js daily');
    console.log('- Weekly: node tools/run-growth-system.js weekly');
    console.log('- Monthly: node tools/run-growth-system.js monthly');
  }

  // Main execution based on command line argument
  async run(frequency = 'setup') {
    console.log('🚀 WeddingCounselors.com Growth Automation System\n');
    console.log('===============================================\n');
    
    try {
      switch (frequency) {
        case 'daily':
          await this.runDaily();
          break;
        case 'weekly':
          await this.runWeekly();
          break;
        case 'monthly':
          await this.runMonthly();
          break;
        case 'setup':
        default:
          await this.setupScheduler();
          console.log('\n🎯 Ready to start automated growth!');
          console.log('\nRecommended first steps:');
          console.log('1. Run: node tools/run-growth-system.js daily');
          console.log('2. Monitor email performance');
          console.log('3. Schedule weekly runs');
          break;
      }
    } catch (error) {
      console.error('❌ Growth system failed:', error);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const frequency = process.argv[2] || 'setup';
  const growthSystem = new GrowthSystem();
  growthSystem.run(frequency);
}

module.exports = GrowthSystem;