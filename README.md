# Premarital Counseling Directory

**A complete, turnkey online directory connecting couples with qualified premarital counseling professionals.**

This professional-grade directory helps couples find therapists, coaches, and clergy who specialize in relationship preparation and marriage readiness. Built with modern technologies and beautiful minimalist design for optimal user experience.

## Key Features

### For Couples
- **Smart Search & Filtering** - Find professionals by location, specialty, and profession type
- **Detailed Profiles** - Comprehensive information about each professional's background and approach
- **Direct Contact** - Built-in contact forms and direct communication options
- **Beautiful Design** - Clean, minimalist interface that builds trust and confidence

### For Professionals
- **Profile Management** - Claim and customize your professional listing
- **Lead Generation** - Receive contact requests directly from interested couples
- **Specialization Showcase** - Highlight your unique expertise and methodologies
- **Featured Listings** - Premium placement options for increased visibility

### Technical Features
- **Database:** PostgreSQL via Supabase with Row Level Security
- **Authentication:** Secure user authentication and profile claiming
- **File Storage:** Profile photo uploads via Supabase Storage
- **Real-time Updates:** Live data synchronization
- **SEO Optimized:** Built for search engine visibility
- **Beautiful Design:** WordPress-quality minimalist interface

## Technology Stack

- **Frontend:** React 18 with React Router
- **Backend:** Supabase (PostgreSQL + API + Auth)
- **Styling:** Custom CSS with sophisticated design system
- **Deployment:** Vercel/Netlify ready
- **Data Processing:** Python scripts for data management

## Quick Start

**Get the directory running with your Supabase data:**

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start development server
npm start
```

**Requirements:**
- Valid Supabase project with environment variables configured
- .env.local file with your Supabase credentials
- Professional profiles in your Supabase database

**Application will open at: http://localhost:3000**

---

## Production Setup

### Option 1: Automated Setup (Recommended)

```bash
# Clone and navigate to the project
cd premarital_directory

# Run the automated setup script
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project and save your Project URL and anon key

2. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env.local
   
   # Edit with your Supabase credentials
   # REACT_APP_SUPABASE_URL=your_project_url
   # REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

3. **Install Dependencies**
   ```bash
   cd client
   npm install
   ```

4. **Database Setup**
   ```bash
   # Install Supabase CLI: https://supabase.com/docs/guides/cli
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

5. **Seed Sample Data**
   ```bash
   cd scripts
   pip install -r requirements.txt
   python3 seed_database.py
   ```

6. **Start Development Server**
   ```bash
   cd client
   npm start
   ```

## Project Structure

```
premarital_directory/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Main application pages
│   │   ├── lib/           # Supabase client and utilities
│   │   └── assets/        # Styles and static assets
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
├── supabase/              # Database and backend configuration
│   └── migrations/        # Database schema definitions
├── scripts/               # Data processing and seeding scripts
│   ├── seed_database.py   # Upload sample data to Supabase
│   ├── scraper.py         # Data collection utilities
│   └── requirements.txt   # Python dependencies
├── API_DOCUMENTATION.md   # Complete API reference
├── PROGRESS.md           # Development progress tracking
└── README.md             # This file
```

## User Journey & Flow

### For Couples Seeking Counseling
1. **Discover** - Land on beautiful homepage with clear value proposition
2. **Search** - Use elegant filters to find professionals by location/specialty
3. **Browse** - View professional profiles with clean, detailed information
4. **Connect** - Contact professionals directly through beautiful forms
5. **Engage** - Begin their premarital counseling journey

### For Professionals
1. **Find** - Discover their existing profile in the directory
2. **Claim** - Complete the professional claiming process with beautiful multi-step forms
3. **Customize** - Update their profile with photos, bio, and specialties
4. **Receive** - Get contacted by couples seeking their services
5. **Grow** - Expand their practice through directory exposure

## Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
```

### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod

# Configure environment variables in Netlify dashboard
```

## Monetization Strategy

- **Featured Listings** - Premium placement for professionals
- **Enhanced Profiles** - Additional customization options
- **Priority Support** - Dedicated customer service
- **Analytics Dashboard** - Professional performance insights

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Analyze bundle size
npm run analyze

# Deploy to Vercel
npm run deploy:vercel

# Deploy to Netlify
npm run deploy:netlify
```

## Documentation

- **[API Documentation](API_DOCUMENTATION.md)** - Complete backend API reference
- **[Progress Tracking](PROGRESS.md)** - Development status and milestones
- **[Environment Setup](.env.example)** - Configuration template

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

If you encounter any issues or have questions:

1. Check the [API Documentation](API_DOCUMENTATION.md)
2. Review the [Progress Tracking](PROGRESS.md) for known issues
3. Create an issue in the repository
4. Contact the development team

## Future Enhancements

- Advanced search with AI-powered matching
- Video consultation booking integration
- Professional credential verification system
- Mobile app for iOS and Android
- Multi-language support
- Advanced analytics and reporting

---

**Built with care for couples beginning their journey together**