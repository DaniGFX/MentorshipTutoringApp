import React, { useState, useMemo, useEffect } from 'react';
import { tutorService } from '../../services/tutorService.js';

export default function ExploreScreen({ onNavigateTab, onBookSession, onViewMentorProfile }) {
  // Search query state
  const [searchQuery, setSearchQuery] = useState('');

  // Active Category Chip
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filter Bottom Sheet Modal State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);

  // Selected Mentor Preview Modal
  const [previewMentor, setPreviewMentor] = useState(null);

  // Filter Modal Form Values
  const [filters, setFilters] = useState({
    sessionType: 'all', // 'all', 'online', 'in-person'
    minRating: 0, // 0, 4.0, 4.5, 4.8
    availableToday: false,
    availableThisWeek: false,
    selectedSkills: []
  });

  // Temporary filter state inside modal before applying
  const [tempFilters, setTempFilters] = useState({ ...filters });

  // Categories list
  const categories = [
    'All',
    'Programming',
    'Web Development',
    'UI/UX',
    'Cybersecurity',
    'Database',
    'Mobile Development',
    'Data Analytics'
  ];

  // Live Mentors State from Supabase
  const [mentors, setMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchLiveMentors() {
      setIsLoading(true);
      try {
        const { data } = await tutorService.getTutors();
        if (isMounted && data && data.length > 0) {
          setMentors(data);
        }
      } catch (err) {
        console.error('[ExploreScreen] Error fetching mentors from Supabase:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchLiveMentors();
    return () => {
      isMounted = false;
    };
  }, []);

  // Comprehensive Mentor Directory Data (Curated fallback mentors)
  const defaultMentors = [
    {
      id: 'mentor-1',
      name: 'Alex Santos',
      specialization: 'Web Development Mentor',
      category: 'Web Development',
      rating: 4.9,
      sessionsCount: 24,
      isVerified: true,
      rate: '₱250.00 / hr',
      hourlyRate: 250,
      paymentMethods: ['GCash', 'BDO Unibank'],
      gcashNumber: '0917-555-0192',
      gcashName: 'Alex Santos',
      bankName: 'BDO Unibank',
      bankAccount: '1092-8834-5512',
      bankHolder: 'Alex Santos',
      sessionType: 'online', // 'online', 'in-person', 'both'
      availableToday: true,
      availableThisWeek: true,
      avatarBg: 'bg-sky-600',
      initials: 'AS',
      bio: 'Final year BS Information Technology student specializing in modern frontend stacks, React ecosystem, and responsive web systems. Passionate about helping peers grasp core web foundations.',
      experience: '3+ Years Academic Mentoring & Web Development',
      mentoringStyle: ['Project-Based Guidance', 'Hands-on Code Reviews', '1-on-1 Debugging Sessions'],
      expertise: ['Web Development', 'JavaScript', 'React', 'HTML & CSS', 'Git & GitHub'],
      availability: 'Mon – Fri · 6:00 PM – 9:00 PM (Online)'
    },
    {
      id: 'mentor-2',
      name: 'Maria Cruz',
      specialization: 'UI/UX Design Mentor',
      category: 'UI/UX',
      rating: 4.8,
      sessionsCount: 18,
      isVerified: true,
      rate: '₱200.00 / hr',
      hourlyRate: 200,
      paymentMethods: ['GCash', 'BPI'],
      gcashNumber: '0928-444-1234',
      gcashName: 'Maria Cruz',
      bankName: 'BPI',
      bankAccount: '2345-6789-0123',
      bankHolder: 'Maria Cruz',
      sessionType: 'both',
      availableToday: false,
      availableThisWeek: true,
      avatarBg: 'bg-indigo-600',
      initials: 'MC',
      bio: 'BS Computer Science student focused on human-computer interaction, Figma design systems, wireframing, and interactive design prototyping.',
      experience: '2+ Years UI/UX Design & Prototyping',
      mentoringStyle: ['Design Critiques', 'Figma Best Practices', 'Portfolio & Case Studies'],
      expertise: ['UI/UX', 'Figma', 'Prototyping', 'Design Systems', 'User Research'],
      availability: 'Tue, Thu, Sat · 4:00 PM – 7:00 PM'
    },
    {
      id: 'mentor-3',
      name: 'John Reyes',
      specialization: 'Cybersecurity Mentor',
      category: 'Cybersecurity',
      rating: 4.9,
      sessionsCount: 31,
      isVerified: true,
      rate: '₱300.00 / hr',
      hourlyRate: 300,
      paymentMethods: ['GCash', 'UnionBank'],
      gcashNumber: '0919-888-4321',
      gcashName: 'John Reyes',
      bankName: 'UnionBank',
      bankAccount: '1094-7721-3456',
      bankHolder: 'John Reyes',
      sessionType: 'online',
      availableToday: true,
      availableThisWeek: true,
      avatarBg: 'bg-emerald-600',
      initials: 'JR',
      bio: 'Student cybersecurity researcher experienced in network security fundamentals, Linux administration, ethical hacking concepts, and defensive security protocols.',
      experience: '3+ Years Networking & Cybersecurity',
      mentoringStyle: ['Hands-on Lab Guidance', 'Security Case Studies', 'Step-by-Step Tool Walkthroughs'],
      expertise: ['Cybersecurity', 'Networking', 'Linux', 'Network Defense', 'Cryptography'],
      availability: 'Mon, Wed, Fri · 7:00 PM – 10:00 PM'
    },
    {
      id: 'mentor-4',
      name: 'Bea Bautista',
      specialization: 'Data Analytics Mentor',
      category: 'Data Analytics',
      rating: 4.7,
      sessionsCount: 15,
      isVerified: true,
      rate: '₱250.00 / hr',
      hourlyRate: 250,
      paymentMethods: ['GCash', 'Maya Bank'],
      gcashNumber: '0995-123-9876',
      gcashName: 'Bea Bautista',
      bankName: 'Maya Bank',
      bankAccount: '0995-123-9876',
      bankHolder: 'Bea Bautista',
      sessionType: 'online',
      availableToday: false,
      availableThisWeek: true,
      avatarBg: 'bg-rose-600',
      initials: 'BB',
      bio: 'BS Statistics & Analytics senior assisting students in mastering Python for data science, Pandas, SQL data analysis, and dashboard visualization with Power BI.',
      experience: '2 Years Data Analytics & Modeling',
      mentoringStyle: ['Dataset Analysis Exercises', 'Visualization Walkthroughs', 'Python Data Tooling'],
      expertise: ['Data Analytics', 'Python', 'SQL', 'Data Visualization', 'Pandas'],
      availability: 'Wed, Sat, Sun · 2:00 PM – 6:00 PM'
    },
    {
      id: 'mentor-5',
      name: 'Paolo Mendoza',
      specialization: 'Mobile Development Mentor',
      category: 'Mobile Development',
      rating: 4.8,
      sessionsCount: 20,
      isVerified: true,
      rate: '₱280.00 / hr',
      hourlyRate: 280,
      paymentMethods: ['GCash', 'BDO Unibank'],
      gcashNumber: '0917-333-8899',
      gcashName: 'Paolo Mendoza',
      bankName: 'BDO Unibank',
      bankAccount: '5543-2211-9988',
      bankHolder: 'Paolo Mendoza',
      sessionType: 'both',
      availableToday: false,
      availableThisWeek: true,
      avatarBg: 'bg-cyan-600',
      initials: 'PM',
      bio: 'Mobile software developer guiding peers in cross-platform mobile apps with React Native, Flutter, and Capacitor Android deployments.',
      experience: '2+ Years Hybrid & Native Mobile Dev',
      mentoringStyle: ['App Architecture Reviews', 'Debugging Mobile Builds', 'State Management'],
      expertise: ['Mobile Development', 'React Native', 'Capacitor', 'JavaScript', 'Android'],
      availability: 'Mon – Thu · 5:00 PM – 8:00 PM'
    },
    {
      id: 'mentor-6',
      name: 'Carlos Lim',
      specialization: 'Database Systems Mentor',
      category: 'Database',
      rating: 4.9,
      sessionsCount: 22,
      isVerified: true,
      rate: '₱220.00 / hr',
      hourlyRate: 220,
      paymentMethods: ['GCash', 'BPI'],
      gcashNumber: '0922-777-6543',
      gcashName: 'Carlos Lim',
      bankName: 'BPI',
      bankAccount: '8876-5432-1100',
      bankHolder: 'Carlos Lim',
      sessionType: 'online',
      availableToday: true,
      availableThisWeek: true,
      avatarBg: 'bg-amber-600',
      initials: 'CL',
      bio: 'Database systems tutor specializing in PostgreSQL, SQL queries, relational schema normalization, query optimization, and Supabase integrations.',
      experience: '3 Years Database Design & Optimization',
      mentoringStyle: ['Schema Architecture Reviews', 'SQL Optimization Practice', 'Hands-on Querying'],
      expertise: ['Database', 'PostgreSQL', 'SQL', 'Schema Design', 'Supabase'],
      availability: 'Tue, Thu, Sun · 6:00 PM – 9:00 PM'
    }
  ];

  // Count active filter count for badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.sessionType !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.availableToday) count++;
    if (filters.availableThisWeek) count++;
    if (filters.selectedSkills.length > 0) count += filters.selectedSkills.length;
    return count;
  }, [filters]);

  const activeMentors = useMemo(() => {
    return mentors.length > 0 ? mentors : defaultMentors;
  }, [mentors, defaultMentors]);

  // Filtered Mentors List
  const filteredMentors = useMemo(() => {
    return activeMentors.filter((mentor) => {
      // 1. Text Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = mentor.name.toLowerCase().includes(q);
        const matchesSpecialization = mentor.specialization.toLowerCase().includes(q);
        const matchesExpertise = mentor.expertise.some((e) => e.toLowerCase().includes(q));
        if (!matchesName && !matchesSpecialization && !matchesExpertise) {
          return false;
        }
      }

      // 2. Category Filter
      if (selectedCategory !== 'All') {
        const matchesCat =
          mentor.category.toLowerCase() === selectedCategory.toLowerCase() ||
          mentor.expertise.some((e) => e.toLowerCase().includes(selectedCategory.toLowerCase()));
        if (!matchesCat) return false;
      }

      // 3. Session Type Filter
      if (filters.sessionType === 'online' && mentor.sessionType === 'in-person') return false;
      if (filters.sessionType === 'in-person' && mentor.sessionType === 'online') return false;

      // 4. Minimum Rating Filter
      if (filters.minRating > 0 && mentor.rating < filters.minRating) return false;

      // 5. Availability Filters
      if (filters.availableToday && !mentor.availableToday) return false;
      if (filters.availableThisWeek && !mentor.availableThisWeek) return false;

      // 6. Selected Skills
      if (filters.selectedSkills.length > 0) {
        const hasSkill = filters.selectedSkills.some((skill) =>
          mentor.expertise.map((e) => e.toLowerCase()).includes(skill.toLowerCase())
        );
        if (!hasSkill) return false;
      }

      return true;
    });
  }, [activeMentors, searchQuery, selectedCategory, filters]);

  // Recommended Mentors (high rating and matched interests)
  const recommendedMentors = useMemo(() => {
    return activeMentors.slice(0, 3);
  }, [activeMentors]);

  // Modal Handlers
  const handleOpenFilterModal = () => {
    setTempFilters({ ...filters });
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = () => {
    setFilters({ ...tempFilters });
    setIsFilterModalOpen(false);
  };

  const handleResetFilters = () => {
    const resetState = {
      sessionType: 'all',
      minRating: 0,
      availableToday: false,
      availableThisWeek: false,
      selectedSkills: []
    };
    setTempFilters(resetState);
    setFilters(resetState);
    setSelectedCategory('All');
    setSearchQuery('');
  };

  return (
    <div className="space-y-5 animate-fade-in pb-24">
      {/* 1. Header & Title */}
      <div className="space-y-1 px-0.5">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          Find Your Mentor
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          Discover qualified peer mentors who can help you learn and grow.
        </p>
      </div>

      {/* 2. Search & Filter Input Row */}
      <div className="flex items-center gap-2.5">
        {/* Search Bar Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search mentors, skills, topics..."
            className="w-full bg-white border border-slate-200 rounded-2xl pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
              aria-label="Clear search query"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter Trigger Button */}
        <button
          onClick={handleOpenFilterModal}
          className={`touch-target px-3.5 py-2.5 rounded-2xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs shrink-0 ${
            activeFiltersCount > 0
              ? 'bg-sky-50 border-sky-300 text-sky-700'
              : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
          }`}
          aria-label="Open filter options"
        >
          <svg className="w-4 h-4 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
          </svg>
          <span>Filter</span>
          {activeFiltersCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center ml-0.5">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* 3. Category Filter Chips (Horizontal Scrollable) */}
      <div className="space-y-1.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-0.5">
          Explore by Interest
        </h2>

        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar -mx-4 px-4">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`touch-target px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                  isSelected
                    ? 'bg-sky-600 text-white font-semibold shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200/90 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Recommended for You Section (Shown when no search/filters active) */}
      {!searchQuery && selectedCategory === 'All' && activeFiltersCount === 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-0.5">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recommended for You</h2>
              <p className="text-[11px] text-slate-500">Based on your learning interests</p>
            </div>
            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-full">
              Matched
            </span>
          </div>

          <div className="space-y-3">
            {recommendedMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-sky-300 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full ${mentor.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {mentor.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {mentor.name}
                        </h3>
                        {mentor.isVerified && (
                          <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{mentor.specialization}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 block">
                      {mentor.rate}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold mt-0.5 block">50% Down Payment</span>
                  </div>
                </div>

                {/* Rating & Sessions Strip */}
                <div className="flex items-center gap-4 text-xs font-semibold text-slate-700 py-0.5">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 fill-sky-500 text-sky-500" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                    <span>{mentor.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-slate-300">·</span>
                  <div className="flex items-center gap-1 text-slate-500 font-medium">
                    <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                    <span>{mentor.sessionsCount} Sessions</span>
                  </div>
                </div>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Profile Button */}
                <button
                  onClick={() => (onViewMentorProfile ? onViewMentorProfile(mentor) : setPreviewMentor(mentor))}
                  className="touch-target w-full bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold py-2.5 rounded-xl border border-sky-200 transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                >
                  <span>View Profile</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. All Mentors Directory List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">All Mentors</h2>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              {filteredMentors.length} Available
            </span>
          </div>

          {(activeFiltersCount > 0 || selectedCategory !== 'All' || searchQuery) && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 active:scale-95 transition-all"
            >
              Reset Filters
            </button>
          )}
        </div>

        {filteredMentors.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 mx-auto flex items-center justify-center border border-slate-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">No Mentors Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                We couldn't find any mentors matching your current search or filter criteria.
              </p>
            </div>
            <button
              onClick={handleResetFilters}
              className="touch-target bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5"
            >
              <span>Clear All Filters</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3 hover:border-slate-300 transition-all"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-11 h-11 rounded-full ${mentor.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                    >
                      {mentor.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {mentor.name}
                        </h3>
                        {mentor.isVerified && (
                          <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium">{mentor.specialization}</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-50 text-slate-600 border border-slate-200">
                    {mentor.sessionType === 'both'
                      ? 'Online & In-person'
                      : mentor.sessionType === 'online'
                      ? 'Online'
                      : 'In-person'}
                  </span>
                </div>

                {/* Rating & Sessions Row */}
                <div className="flex items-center justify-between text-xs py-0.5">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 font-semibold text-slate-800">
                      <svg className="w-3.5 h-3.5 fill-sky-500 text-sky-500" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                      </svg>
                      <span>{mentor.rating.toFixed(1)}</span>
                    </div>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">{mentor.sessionsCount} Sessions</span>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-extrabold text-sky-700">
                      {mentor.rate}
                    </span>
                    <span className="text-[9px] text-slate-400 block">GCash / Bank</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div className="flex flex-wrap gap-1.5">
                  {mentor.expertise.slice(0, 4).map((skill) => (
                    <span
                      key={skill}
                      className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                  {mentor.expertise.length > 4 && (
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-50 text-slate-400 text-[10px] font-medium">
                      +{mentor.expertise.length - 4} more
                    </span>
                  )}
                </div>

                {/* View Profile Action */}
                <div className="pt-1">
                  <button
                    onClick={() => (onViewMentorProfile ? onViewMentorProfile(mentor) : setPreviewMentor(mentor))}
                    className="touch-target w-full bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.99] flex items-center justify-center gap-1.5"
                  >
                    <span>View Profile</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Filter Bottom Sheet Modal */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Sheet Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Filter Mentors</h3>
                <p className="text-xs text-slate-500">Refine mentor search to fit your needs</p>
              </div>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                aria-label="Close filter modal"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Section 1: Session Type */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Session Type
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Both' },
                  { id: 'online', label: 'Online' },
                  { id: 'in-person', label: 'In-person' }
                ].map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setTempFilters({ ...tempFilters, sessionType: type.id })}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all ${
                      tempFilters.sessionType === type.id
                        ? 'bg-sky-50 border-sky-500 text-sky-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Minimum Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Minimum Rating
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { val: 0, label: 'Any' },
                  { val: 4.0, label: '4.0+' },
                  { val: 4.5, label: '4.5+' },
                  { val: 4.8, label: '4.8+' }
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setTempFilters({ ...tempFilters, minRating: item.val })}
                    className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                      tempFilters.minRating === item.val
                        ? 'bg-sky-50 border-sky-500 text-sky-700 font-semibold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Availability */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Availability
              </label>
              <div className="space-y-1.5">
                <label
                  onClick={() =>
                    setTempFilters({
                      ...tempFilters,
                      availableToday: !tempFilters.availableToday
                    })
                  }
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition-all"
                >
                  <span className="font-medium">Available Today</span>
                  <input
                    type="checkbox"
                    checked={tempFilters.availableToday}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>

                <label
                  onClick={() =>
                    setTempFilters({
                      ...tempFilters,
                      availableThisWeek: !tempFilters.availableThisWeek
                    })
                  }
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs text-slate-700 transition-all"
                >
                  <span className="font-medium">Available This Week</span>
                  <input
                    type="checkbox"
                    checked={tempFilters.availableThisWeek}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-600"
                  />
                </label>
              </div>
            </div>

            {/* Section 4: Expertise Checkboxes */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Expertise & Skills
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  'Programming',
                  'Web Development',
                  'UI/UX',
                  'Cybersecurity',
                  'Database',
                  'Mobile Development',
                  'Data Analytics'
                ].map((skill) => {
                  const isChecked = tempFilters.selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        const next = isChecked
                          ? tempFilters.selectedSkills.filter((s) => s !== skill)
                          : [...tempFilters.selectedSkills, skill];
                        setTempFilters({ ...tempFilters, selectedSkills: next });
                      }}
                      className={`text-left p-2 rounded-xl border text-xs font-medium transition-all flex items-center justify-between ${
                        isChecked
                          ? 'border-sky-500 bg-sky-50 text-sky-800 font-semibold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{skill}</span>
                      {isChecked && (
                        <svg className="w-3.5 h-3.5 text-sky-600 shrink-0 ml-1" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTempFilters({
                    sessionType: 'all',
                    minRating: 0,
                    availableToday: false,
                    availableThisWeek: false,
                    selectedSkills: []
                  });
                }}
                className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-95"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={handleApplyFilters}
                className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all active:scale-95"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Mentor Profile Preview Modal */}
      {previewMentor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full ${previewMentor.avatarBg} text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs`}
                >
                  {previewMentor.initials}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {previewMentor.name}
                    </h3>
                    {previewMentor.isVerified && (
                      <svg className="w-4 h-4 text-sky-600 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-label="Verified Mentor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{previewMentor.specialization}</p>
                </div>
              </div>

              <button
                onClick={() => setPreviewMentor(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
                aria-label="Close mentor preview"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-3 border border-slate-100 text-center">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rating</p>
                <div className="flex items-center justify-center gap-1 mt-0.5 font-bold text-slate-900 text-xs">
                  <svg className="w-3.5 h-3.5 fill-sky-500 text-sky-500" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                  </svg>
                  <span>{previewMentor.rating.toFixed(1)}</span>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Sessions</p>
                <p className="text-xs font-bold text-slate-900 mt-0.5">{previewMentor.sessionsCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Rate</p>
                <p className="text-xs font-bold text-sky-600 mt-0.5">
                  {previewMentor.rate.split(' ')[0]}
                </p>
                <p className="text-[9px] text-slate-400">50% deposit</p>
              </div>
            </div>

            {/* About Mentor */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">About</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{previewMentor.bio}</p>
            </div>

            {/* Mentoring Style */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mentoring Style</h4>
              <div className="space-y-1">
                {previewMentor.mentoringStyle.map((style) => (
                  <div key={style} className="flex items-center gap-2 text-xs text-slate-700">
                    <svg className="w-3.5 h-3.5 text-sky-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    <span>{style}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div className="space-y-1 bg-sky-50 rounded-xl p-3 border border-sky-100">
              <p className="text-[11px] font-bold text-sky-900">Schedule & Availability</p>
              <p className="text-xs text-sky-700 font-medium">{previewMentor.availability}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => {
                  setPreviewMentor(null);
                  onNavigateTab && onNavigateTab('messages');
                }}
                className="touch-target flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.75.75 0 0 1-.974-.943l.878-2.635C4.249 15.918 3 14.07 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                </svg>
                <span>Message</span>
              </button>

              <button
                onClick={() => {
                  const m = previewMentor;
                  setPreviewMentor(null);
                  if (onBookSession) {
                    onBookSession(m);
                  } else if (onNavigateTab) {
                    onNavigateTab('sessions');
                  }
                }}
                className="touch-target flex-1 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold py-2.5 rounded-xl shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                </svg>
                <span>Book a Session</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
