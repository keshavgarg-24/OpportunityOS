import React, { useState, useEffect } from 'react';

const skillGroups = {
  'Programming Languages': ['C', 'C++', 'C#', 'Java', 'Python', 'JavaScript', 'TypeScript', 'Go', 'Rust', 'Kotlin', 'Swift', 'PHP', 'Ruby', 'R', 'SQL'],
  'Frontend': ['HTML', 'CSS', 'Sass', 'Bootstrap', 'Tailwind CSS', 'React', 'Next.js', 'Vue', 'Angular', 'Svelte', 'Redux', 'jQuery'],
  'Backend & APIs': ['Node.js', 'Express', 'Django', 'Flask', 'FastAPI', 'Spring Boot', '.NET', 'Laravel', 'REST APIs', 'GraphQL', 'WebSockets'],
  'Databases & Cloud': ['MongoDB', 'PostgreSQL', 'MySQL', 'SQLite', 'Redis', 'Firebase', 'Supabase', 'AWS', 'Azure', 'Google Cloud', 'Vercel'],
  'AI & Data': ['Machine Learning', 'Deep Learning', 'Data Analysis', 'Pandas', 'NumPy', 'TensorFlow', 'PyTorch', 'NLP', 'Computer Vision', 'Power BI', 'Tableau'],
  'Tools & Core': ['Git', 'GitHub', 'GitLab', 'Linux', 'Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'Figma', 'Postman', 'Data Structures', 'Algorithms', 'OOP', 'System Design', 'Testing'],
};

const roleOptions = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Data Analyst', 'Machine Learning Engineer', 'UI/UX Designer', 'Product Intern'];
const knownSkills = [...new Set(Object.values(skillGroups).flat().map(skill => skill.trim()))];
const opportunityDiscoveryLinks = [
  { name: 'LinkedIn internships (India)', url: 'https://www.linkedin.com/jobs/search/?keywords=internship&location=India' },
];
const coerHackathonActive = Date.now() <= Date.parse('2026-10-10T23:59:59+05:30');
const profileDefaults = {
  name: '', email: '', phone: '', location: '', college: '', degree: '', branch: '',
  graduationYear: '', cgpa: '', github: '', linkedin: '', portfolio: '', resume: '',
  skills: [], experience: '', experienceDetails: '', projects: '', certifications: '',
  preferredRoles: [], workPreference: '', bio: '',
};

const getProfileCompleteness = (profile) => {
  const sections = [
    Boolean(profile.name && profile.email && profile.phone && profile.location),
    Boolean(profile.college && profile.degree && profile.branch && profile.graduationYear && profile.cgpa),
    profile.skills.length > 0,
    Boolean(profile.experience && profile.experienceDetails),
    Boolean(profile.projects),
    profile.preferredRoles.length > 0,
    Boolean(profile.github || profile.linkedin || profile.portfolio),
    Boolean(profile.resume),
    Boolean(profile.bio),
  ];
  return Math.round(sections.filter(Boolean).length / sections.length * 100);
};

const getSkillMatch = (profile, opportunity) => {
  if (!profile.skills.length) return null;
  const details = `${opportunity.title} ${opportunity.company || ''} ${(opportunity.tags || []).join(' ')} ${opportunity.description || ''}`.toLowerCase();
  const matched = profile.skills.filter(skill => {
    const escaped = skill.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, 'i').test(details);
  });
  return { percent: Math.round(matched.length / profile.skills.length * 100), matched };
};

const normalizeOpportunity = (opportunity) => ({
  ...opportunity,
  id: opportunity._id || opportunity.id,
  loc: opportunity.location || opportunity.loc || 'Location not listed',
  type: opportunity.type ? opportunity.type.replace('-', ' ').replace(/\b\w/g, letter => letter.toUpperCase()) : 'Opportunity',
  deadline: opportunity.deadline || 'See listing',
  tags: Array.isArray(opportunity.tags) ? opportunity.tags : [],
});

function App() {
  const [active, setActive] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('authUser') || 'null')?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard';
    } catch {
      return 'Dashboard';
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(localStorage.getItem('token')));
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('authUser') || 'null');
    } catch {
      return null;
    }
  });
  const [authForm, setAuthForm] = useState({ name:'', email:'', password:'' });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [profile, setProfile] = useState(profileDefaults);
  const [editingProfile, setEditingProfile] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [saved, setSaved] = useState([]);
  const [applications, setApplications] = useState([]);
  const [customOpps, setCustomOpps] = useState([]);
  const [myOpps, setMyOpps] = useState([]);
  const [postedOpps, setPostedOpps] = useState([]);
  const [myOppsError, setMyOppsError] = useState('');
  const [applyTarget, setApplyTarget] = useState(null);
  const [applyForm, setApplyForm] = useState({ name:'', email:'', phone:'', resume:'', coverLetter:'' });
  const [applyError, setApplyError] = useState('');
  const [applying, setApplying] = useState(false);
  const [addingOpp, setAddingOpp] = useState(false);
  const [liveOpps, setLiveOpps] = useState([]);
  const [feedSources, setFeedSources] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const [feedUpdated, setFeedUpdated] = useState('');
  const [adminData, setAdminData] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [sessionError, setSessionError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [newOpp, setNewOpp] = useState({ title:'', type:'Internship', loc:'Remote', company:'', description:'', link:'', tags:'' });

  const baseOpportunities = [
    { id:2, title:'ETHGlobal Hackathon', type:'Hackathon', loc:'Bangalore', deadline:'5 days left', tags:['Web3','Beginner Friendly'] },
    { id:3, title:'GSoC - React Org', type:'Open Source', loc:'Remote', deadline:'1 week left', tags:['Open Source','Remote'] },
    { id:5, title:'MLH Global Hack Week', type:'Hackathon', loc:'Remote', deadline:'1 day left', tags:['Beginner Friendly'] },
    { id:8, title:'FOSS United Contributor', type:'Open Source', loc:'Remote', deadline:'Ongoing', tags:['Open Source'] },
    ...(coerHackathonActive ? [{
      id: 'disha-coer-hackathon-6',
      title: 'COER Hackathon 6.0',
      type: 'Hackathon',
      loc: 'See official event page',
      deadline: 'Ends Oct 10, 2026',
      tags: ['Coding', '24 Hours', 'COER University', 'Entry fee: ₹499', 'Prize: ₹2,70,000'],
      company: 'Disha - COER University',
      description: "India's 24-hour coding marathon. Verify event details and registration availability on the official page.",
      link: 'https://forms.gle/sScAHeyLebzyxR979',
      source: 'Disha COER',
      sourceUrl: 'https://disha-coer.com/events/national-hackathon',
    }] : []),
  ];

  const allOpportunities = [...baseOpportunities,...liveOpps,...postedOpps,...customOpps];
  const isAdmin = user?.role === 'admin';

  useEffect(()=>{
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch('http://localhost:5000/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    }).then(async response => {
      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('authUser');
        setUser(null);
        setIsAuthenticated(false);
        setActive('Login');
        return;
      }
      if (!response.ok) throw new Error(data.message || 'Session expired.');
      localStorage.setItem('authUser', JSON.stringify(data.user));
      setUser(data.user);
      setIsAuthenticated(true);
      setSessionError('');
      setActive(current => {
        if (data.user.role === 'admin' && current === 'Dashboard') return 'Admin Dashboard';
        if (data.user.role !== 'admin' && current === 'Admin Dashboard') return 'Dashboard';
        return current;
      });
    }).catch(error => {
      setSessionError(error.message || 'Could not verify the current account.');
    });
  },[]);

  const loadAdminDashboard = async () => {
    setAdminLoading(true);
    setAdminError('');
    try {
      const response = await fetch('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load admin activity.');
      setAdminData(data);
    } catch (error) {
      setAdminError(error.message || 'Could not load admin activity.');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadMyOpportunities = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setMyOppsError('');
    try {
      const response = await fetch('http://localhost:5000/api/opportunities/mine', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load your opportunities.');
      setMyOpps(data.map(normalizeOpportunity));
    } catch (error) {
      setMyOppsError(error.message || 'Could not load your opportunities.');
    }
  };

  const loadPostedOpportunities = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/opportunities');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load posted opportunities.');
      setPostedOpps(data.map(normalizeOpportunity));
    } catch (error) {
      setFeedError(current => current || error.message || 'Could not load posted opportunities.');
    }
  };

  const loadOpportunityFeed = async () => {
    setFeedLoading(true);
    setFeedError('');
    try {
      const response = await fetch('http://localhost:5000/api/feed/opportunities');
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Could not load live opportunities.');
      setLiveOpps(data.items || []);
      setFeedSources(data.sources || []);
      setFeedUpdated(data.updatedAt || '');
      const unavailable = (data.sources || []).filter(source => source.error);
      if (unavailable.length) setFeedError(`Some feeds are unavailable: ${unavailable.map(source => source.name).join(', ')}.`);
    } catch (error) {
      setFeedError(error.message || 'Could not connect to the opportunity feeds.');
    } finally {
      setFeedLoading(false);
    }
  };

  useEffect(()=>{
    const sp = localStorage.getItem('studentProfile');
    if(sp) {
      const savedProfile = JSON.parse(sp);
      setProfile(current => ({
        ...current,
        ...savedProfile,
        skills: Array.isArray(savedProfile.skills) ? savedProfile.skills : (savedProfile.skills || '').split(',').map(skill => skill.trim()).filter(Boolean),
        preferredRoles: Array.isArray(savedProfile.preferredRoles) ? savedProfile.preferredRoles : [],
      }));
    }
    const sv = localStorage.getItem('savedOpps'); if(sv) setSaved(JSON.parse(sv));
    const ap = localStorage.getItem('applications'); if(ap) setApplications(JSON.parse(ap));
    const co = localStorage.getItem('customOpps'); if(co) setCustomOpps(JSON.parse(co));
    loadOpportunityFeed();
    loadPostedOpportunities();
    if (localStorage.getItem('token')) loadMyOpportunities();
  },[]);

  useEffect(()=>{
    if (isAdmin && active === 'Admin Dashboard') loadAdminDashboard();
  },[isAdmin,active]);

  const completeLogin = (loginResult) => {
    localStorage.setItem('token', loginResult.token);
    localStorage.setItem('authUser', JSON.stringify(loginResult.user));
    setIsAuthenticated(true);
    setUser(loginResult.user);
    setApplyForm(current => ({
      ...current,
      name: profile.name || loginResult.user.name || '',
      email: profile.email || loginResult.user.email || '',
      phone: profile.phone || '',
      resume: profile.resume || '',
    }));
    loadMyOpportunities();
    setProfile(current => ({
      ...current,
      name: current.name || loginResult.user.name,
      email: current.email || loginResult.user.email,
    }));
    setActive(loginResult.user.role === 'admin' ? 'Admin Dashboard' : 'Dashboard');
    setEditingProfile(false);
    setAuthForm({ name:'', email:'', password:'' });
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (active === 'Register') {
        const registerResponse = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(authForm),
        });
        const registerResult = await registerResponse.json();
        if (!registerResponse.ok) throw new Error(registerResult.message || 'Registration failed');
      }

      const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authForm.email, password: authForm.password }),
      });
      const loginResult = await loginResponse.json();
      if (!loginResponse.ok) throw new Error(loginResult.message || 'Login failed');

      completeLogin(loginResult);
    } catch (error) {
      setAuthError(error.message || 'Unable to connect to the server');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authUser');
    setIsAuthenticated(false);
    setUser(null);
    setMobileOpen(false);
    setActive('Login');
  };

  const saveProfile = (event) => {
    event.preventDefault();
    localStorage.setItem('studentProfile', JSON.stringify(profile));
    setEditingProfile(false);
  };

  const cancelProfileEdit = () => {
    const savedProfile = JSON.parse(localStorage.getItem('studentProfile') || 'null');
    setProfile({
      ...profileDefaults,
      name: user?.name || '',
      email: user?.email || '',
      ...savedProfile,
      skills: Array.isArray(savedProfile?.skills) ? savedProfile.skills : (savedProfile?.skills || '').split(',').map(skill => skill.trim()).filter(Boolean),
      preferredRoles: Array.isArray(savedProfile?.preferredRoles) ? savedProfile.preferredRoles : [],
    });
    setEditingProfile(false);
  };

  const toggleProfileSelection = (field, value) => {
    setProfile(current => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter(item => item !== value)
        : [...current[field], value],
    }));
  };

  const addCustomSkill = (event) => {
    event.preventDefault();
    const skill = newSkill.trim();
    if (!skill) return;
    if (profile.skills.some(existing => existing.toLowerCase() === skill.toLowerCase())) {
      setNewSkill('');
      return;
    }
    setProfile(current => ({ ...current, skills: [...current.skills, skill] }));
    setNewSkill('');
  };

  const toggleSave = (opp) => { let ns = saved.find(s=>s.id===opp.id)? saved.filter(s=>s.id!==opp.id) : [...saved, opp]; setSaved(ns); localStorage.setItem('savedOpps', JSON.stringify(ns)); };
  const addApplication = (opp) => { if(applications.find(a=>a.id===opp.id)) return alert('Already in Track Workflow'); const na = [...applications, {...opp, stage:'Applied'}]; setApplications(na); localStorage.setItem('applications', JSON.stringify(na)); alert('Added to Track Workflow +35 XP'); setActive('Track Workflow'); };
  const moveStage = (id, ns) => { const up = applications.map(a=> a.id===id? {...a, stage:ns} : a); setApplications(up); localStorage.setItem('applications', JSON.stringify(up)); };
  const handleAddOpp = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setMyOppsError('Log in to publish and manage opportunities.');
      return;
    }
    setMyOppsError('');
    setAddingOpp(true);
    try {
      const response = await fetch('http://localhost:5000/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: newOpp.title,
          company: newOpp.company,
          description: newOpp.description,
          type: newOpp.type.toLowerCase().replace(' ', '-'),
          location: newOpp.loc,
          link: newOpp.link,
          tags: newOpp.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not add opportunity.');
      const postedOpportunity = normalizeOpportunity(result);
      setMyOpps(current => [postedOpportunity, ...current]);
      setPostedOpps(current => [postedOpportunity, ...current.filter(item => item.id !== postedOpportunity.id)]);
      setNewOpp({ title:'', type:'Internship', loc:'Remote', company:'', description:'', link:'', tags:'' });
    } catch (error) {
      setMyOppsError(error.message || 'Could not add opportunity.');
    } finally {
      setAddingOpp(false);
    }
  };

  const deleteMyOpportunity = async (opportunity) => {
    if (!window.confirm('Delete this opportunity?')) return;
    setMyOppsError('');
    if (opportunity.localOnly) {
      setCustomOpps(current => {
        const updated = current.filter(item => item.id !== opportunity.id);
        localStorage.setItem('customOpps', JSON.stringify(updated));
        return updated;
      });
      return;
    }
    try {
      const response = await fetch(`http://localhost:5000/api/opportunities/${opportunity.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not delete opportunity.');
      setMyOpps(current => current.filter(item => item.id !== opportunity.id));
      setPostedOpps(current => current.filter(item => item.id !== opportunity.id));
    } catch (error) {
      setMyOppsError(error.message || 'Could not delete opportunity.');
    }
  };

  const persistLegacyOpportunity = async (opportunity) => {
    try {
      const response = await fetch('http://localhost:5000/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: opportunity.title,
          company: opportunity.company || '',
          description: opportunity.description || '',
          type: opportunity.type.toLowerCase().replace(' ', '-'),
          location: opportunity.loc || 'Remote',
          link: opportunity.link || '',
          tags: opportunity.tags || [],
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not move this listing to your account.');
      const persisted = normalizeOpportunity(result);
      setMyOpps(current => [persisted, ...current]);
      setPostedOpps(current => [persisted, ...current.filter(item => item.id !== persisted.id)]);
      setCustomOpps(current => {
        const updated = current.filter(item => item.id !== opportunity.id);
        localStorage.setItem('customOpps', JSON.stringify(updated));
        return updated;
      });
      return persisted;
    } catch (error) {
      setMyOppsError(error.message || 'Could not save this older opportunity.');
      return null;
    }
  };

  const openApplyForm = async (opportunity) => {
    const savedOpportunity = /^[a-f\d]{24}$/i.test(opportunity.id)
      ? opportunity
      : await persistLegacyOpportunity(opportunity);
    if (!savedOpportunity) return;
    setApplyTarget(savedOpportunity);
    setApplyError('');
    setApplyForm(current => ({
      ...current,
      name: profile.name || user?.name || current.name,
      email: profile.email || user?.email || current.email,
      phone: profile.phone || current.phone,
      resume: profile.resume || current.resume,
    }));
  };

  const submitApplication = async (event) => {
    event.preventDefault();
    if (!applyTarget || !isAuthenticated) {
      setApplyError('Log in before submitting an application.');
      return;
    }
    setApplying(true);
    setApplyError('');
    try {
      const response = await fetch('http://localhost:5000/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ ...applyForm, opportunityId: applyTarget.id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Could not submit your application.');
      setApplications(current => {
        const updated = [...current, { ...applyTarget, stage:'Applied' }];
        localStorage.setItem('applications', JSON.stringify(updated));
        return updated;
      });
      setApplyTarget(null);
      setActive('Track Workflow');
    } catch (error) {
      setApplyError(error.message || 'Could not submit your application.');
    } finally {
      setApplying(false);
    }
  };

  const filterList = (type) => {
    const query = searchQuery.trim().toLowerCase();
    return allOpportunities.filter(opportunity => {
      if (opportunity.type !== type) return false;
      if (!query) return true;
      const searchableText = [
        opportunity.title,
        opportunity.company,
        opportunity.loc,
        opportunity.description,
        ...(opportunity.tags || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return searchableText.includes(query);
    });
  };
  const totalXP = applications.length*35 + saved.length*10 + (customOpps.length + myOpps.length)*50 + (profile.name?50:0);
  const profileCompleteness = getProfileCompleteness(profile);
  const displayedMyOpps = [
    ...myOpps.map(opportunity => ({ ...opportunity, localOnly: false })),
    ...customOpps.map(opportunity => normalizeOpportunity({ ...opportunity, localOnly: true })),
  ];
  const renderFeedStatus = () => (
    <div className="mb-5 rounded-xl border border-white/10 bg-[#0f172d] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Live opportunity feeds</p>
          <p className="text-xs text-gray-400 mt-1">
            {feedLoading ? 'Loading listings from public sources…' : `${feedSources.reduce((total, source) => total + source.count, 0)} listings loaded`}
            {feedUpdated && ` • Updated ${new Date(feedUpdated).toLocaleString()}`}
          </p>
        </div>
        <button onClick={loadOpportunityFeed} disabled={feedLoading} className="text-xs bg-white/10 hover:bg-white/15 disabled:opacity-50 px-3 py-2 rounded-lg">{feedLoading ? 'Loading…' : 'Refresh feeds'}</button>
      </div>
      {feedSources.length > 0 && <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-gray-400">{feedSources.map(source=><span key={source.name}>{source.name}: {source.count}{source.error ? ' (unavailable)' : ''}</span>)}</div>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
        <span className="text-gray-400">Browse listings directly:</span>
        {opportunityDiscoveryLinks.map(source => <a key={source.name} href={source.url} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">{source.name} ↗</a>)}
      </div>
      {feedError && <p role="status" className="text-xs text-amber-300 mt-3">{feedError}</p>}
      <p className="text-[11px] text-gray-500 mt-2">Listings remain the property of their publishers. Open the original source to review eligibility and apply.</p>
    </div>
  );
  const sidebar = [
    ...(isAdmin ? ['Admin Dashboard','Dashboard'] : ['Dashboard']),
    'Internships','Track Workflow','Hackathons','Open Source','Jobs','Scholarships','Saved Opportunities',
    ...(isAdmin ? ['Add Opportunity'] : []),
    ...(isAuthenticated ? ['Profile'] : ['Login','Register']),
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-8 px-2"><h1 className="text-xl font-extrabold">OpportunityOS</h1><span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-bold">{isAdmin ? 'ADMIN' : 'USER'}</span></div>
      <div className="space-y-1 flex-1">{sidebar.map((item) => (<div key={item} onClick={() => { setActive(item); setMobileOpen(false); setSearchQuery(''); }} className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${active===item? 'bg-blue-600 text-white':'text-gray-400 hover:bg-white/5'}`}>{item}</div>))}</div>
      {isAuthenticated && <button onClick={handleLogout} className="text-left px-3 py-2 mt-2 rounded-lg text-sm text-gray-400 hover:bg-white/5 hover:text-white">Logout{user?.name ? ` (${user.name})` : ''}</button>}
      <div className="mt-4 p-3 bg-white/5 rounded-lg text-xs"><p>Level {Math.floor(totalXP/100)+1}</p><div className="w-full bg-white/10 h-2 rounded-full mt-2"><div className="bg-blue-600 h-2 rounded-full" style={{width:`${totalXP%100}%`}}></div></div><p className="mt-1">{totalXP} XP • {applications.length} Tracked</p></div>
    </>
  );

  const AdminSidebarContent = () => (
    <>
      <div className="px-2 mb-8">
        <p className="text-xl font-extrabold">OpportunityOS</p>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-100">Administration</p>
      </div>
      <div className="flex-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-blue-200">Platform management</p>
        <div
          onClick={() => { setActive('Admin Dashboard'); setMobileOpen(false); }}
          aria-current={active === 'Admin Dashboard' ? 'page' : undefined}
          className={`mb-1 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold ${active === 'Admin Dashboard' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}
        >
          Platform overview
        </div>
        <div
          onClick={() => { setActive('Add Opportunity'); setMobileOpen(false); }}
          aria-current={active === 'Add Opportunity' ? 'page' : undefined}
          className={`cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold ${active === 'Add Opportunity' ? 'bg-white/20 text-white' : 'text-blue-100 hover:bg-white/10'}`}
        >
          Post opportunity
        </div>
      </div>
      <div className="rounded-xl bg-white/10 p-3 text-xs">
        <p className="font-semibold text-white">Administrator</p>
        <p className="mt-1 break-all text-blue-100">{user?.email}</p>
      </div>
      <button onClick={handleLogout} className="mt-3 rounded-lg px-3 py-2 text-left text-sm text-blue-100 hover:bg-white/10">
        Log out
      </button>
    </>
  );

  const OppCard = ({ h }) => (
    <div className="bg-[#0f172d] border border-white/10 p-5 rounded-xl">
      <div className="flex justify-between"><h3 className="font-bold text-sm">{h.title}</h3><span className="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">{h.deadline}</span></div>
      <p className="text-xs text-gray-400 mt-1">{h.company ? `${h.company} • ` : ''}{h.loc} • {h.tags.join(' • ')}</p>
      {h.description && <p className="text-xs text-gray-400 mt-3 line-clamp-3">{h.description}</p>}
      {h.type !== 'Hackathon' && h.type !== 'Open Source' && (() => {
        const match = getSkillMatch(profile, h);
        return <p className={`text-xs mt-3 ${match && match.percent >= 50 ? 'text-green-300' : 'text-blue-300'}`}>{match ? `Skill match: ${match.percent}%${match.matched.length ? ` • ${match.matched.slice(0, 4).join(', ')}` : ''}` : 'Add skills to your profile to see skill match'}</p>;
      })()}
      {h.source && <p className="text-[11px] text-gray-500 mt-2">Source: {h.source}</p>}
      <div className="flex gap-2 mt-3">
        <button onClick={()=>toggleSave(h)} className={`text-xs px-3 py-1.5 rounded-lg ${saved.find(s=>s.id===h.id)?'bg-green-600/20 text-green-300':'bg-white/10'}`}>{saved.find(s=>s.id===h.id)?'Saved ✓':'Save'}</button>
        <button onClick={()=>addApplication(h)} className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg">Track +35 XP</button>
        {h.link && <a href={h.link} target="_blank" rel="noreferrer" className="text-xs bg-white/10 px-3 py-1.5 rounded-lg">Apply ↗</a>}
      </div>
      {h.sourceUrl && <a href={h.sourceUrl} target="_blank" rel="noreferrer" className="text-[11px] text-gray-500 hover:text-gray-300 mt-3 inline-block">View source ↗</a>}
    </div>
  );

  const TrackWorkflow = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Track Workflow</h2>
      <p className="text-sm text-gray-400 mb-4">{applications.length} applications tracked • Drag via dropdown to move stages</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        {['Applied','Interview','Offer','Rejected'].map(stage=>(
          <div key={stage} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 min-h-[250px]">
            <h3 className="font-bold mb-3 text-sm flex justify-between"><span>{stage}</span><span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">{applications.filter(a=>a.stage===stage).length}</span></h3>
            <div className="space-y-2">
              {applications.filter(a=>a.stage===stage).map(app=>(
                <div key={app.id} className="bg-[#080d1c] border border-white/10 p-3 rounded-lg text-xs">
                  <p className="font-bold">{app.title}</p><p className="text-gray-400">{app.loc}</p>
                  {['Job','Internship','Scholarship'].includes(app.type) && (() => {
                    const match = getSkillMatch(profile, app);
                    return <p className="text-blue-300 mt-1">{match ? `Skill match: ${match.percent}%` : 'Add profile skills to see match'}{stage === 'Interview' ? ' • Interview' : ''}</p>;
                  })()}
                  <select value={app.stage} onChange={e=>moveStage(app.id, e.target.value)} className="mt-2 w-full bg-[#0f172d] border border-white/10 rounded px-2 py-1 text-xs">
                    <option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option>
                  </select>
                </div>
              ))}
              {applications.filter(a=>a.stage===stage).length===0 && <p className="text-xs text-gray-500 text-center mt-6">No cards yet</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const AdminDashboard = () => (
    <div className="max-w-7xl mx-auto space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-blue-700">ADMIN CONSOLE</p>
          <h1 className="text-3xl font-bold mt-1">Platform overview</h1>
          <p className="text-sm text-slate-500 mt-1">User registrations, opportunity posts, and application activity.</p>
        </div>
        <button onClick={loadAdminDashboard} disabled={adminLoading} className="bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm">{adminLoading ? 'Refreshing…' : 'Refresh activity'}</button>
      </header>
      {adminError && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{adminError}</div>}
      {adminLoading && !adminData && <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">Loading platform activity…</div>}
      {adminData && (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { label:'Registered users', value:adminData.stats.users, note:`${adminData.stats.admins} admins`, icon:'👥', iconStyle:'bg-blue-50 text-blue-700' },
              { label:'Opportunities', value:adminData.stats.opportunities, note:'User-posted listings', icon:'📌', iconStyle:'bg-violet-50 text-violet-700' },
              { label:'Applications', value:adminData.stats.applications, note:`${adminData.applicationCounts?.submitted || 0} awaiting review`, icon:'📨', iconStyle:'bg-amber-50 text-amber-700' },
              { label:'Active roles', value:Object.values(adminData.opportunityCounts || {}).reduce((sum,count)=>sum+count,0), note:'Across all opportunity types', icon:'📊', iconStyle:'bg-emerald-50 text-emerald-700' },
            ].map(stat=>(
              <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{stat.label}</p><span className={`rounded-xl p-2 ${stat.iconStyle}`}>{stat.icon}</span></div>
                <p className="text-3xl font-bold text-slate-900 mt-4">{stat.value}</p><p className="text-xs text-slate-500 mt-1">{stat.note}</p>
              </article>
            ))}
          </section>
          <div className="grid xl:grid-cols-2 gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100"><h2 className="font-bold">Recent applications</h2><p className="text-xs text-slate-500 mt-1">Latest submissions and applicant contact details</p></div>
              {adminData.applications.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Applicant</th><th className="px-5 py-3">Opportunity</th><th className="px-5 py-3">Submitted</th><th className="px-5 py-3">Resume</th></tr></thead><tbody className="divide-y divide-slate-100">{adminData.applications.slice(0,12).map(application=><tr key={application._id}><td className="px-5 py-3"><p className="font-medium text-slate-800">{application.applicant?.name}</p><p className="text-xs text-slate-500">{application.applicant?.email}</p></td><td className="px-5 py-3 text-slate-700">{application.opportunityId?.title || 'Listing removed'}<p className="text-xs text-slate-500">{application.opportunityId?.company}</p></td><td className="px-5 py-3 whitespace-nowrap text-slate-500">{new Date(application.createdAt).toLocaleDateString()}</td><td className="px-5 py-3">{application.applicant?.resume && <a href={application.applicant.resume} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">Open ↗</a>}</td></tr>)}</tbody></table></div> : <p className="p-8 text-sm text-slate-500">No applications have been submitted yet.</p>}
            </section>
            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-100"><h2 className="font-bold">Recent registrations</h2><p className="text-xs text-slate-500 mt-1">Latest accounts created on the platform</p></div>
              {adminData.users.length ? <div className="divide-y divide-slate-100">{adminData.users.slice(0,12).map(account=><div key={account._id} className="flex items-center justify-between gap-3 px-5 py-3"><div><p className="text-sm font-medium text-slate-800">{account.name}</p><p className="text-xs text-slate-500">{account.email}</p></div><div className="text-right"><span className={`text-[10px] uppercase font-semibold px-2 py-1 rounded-full ${account.role==='admin'?'bg-violet-100 text-violet-700':'bg-slate-100 text-slate-600'}`}>{account.role}</span><p className="text-[11px] text-slate-400 mt-1">{new Date(account.createdAt).toLocaleDateString()}</p></div></div>)}</div> : <p className="p-8 text-sm text-slate-500">No registered users found.</p>}
            </section>
          </div>
          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100"><h2 className="font-bold">Recent opportunity activity</h2><p className="text-xs text-slate-500 mt-1">Listings posted by platform users</p></div>
            {adminData.opportunities.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="px-5 py-3">Opportunity</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Posted by</th><th className="px-5 py-3">Date</th></tr></thead><tbody className="divide-y divide-slate-100">{adminData.opportunities.slice(0,15).map(opportunity=><tr key={opportunity._id}><td className="px-5 py-3 font-medium text-slate-800">{opportunity.title}<p className="text-xs text-slate-500">{opportunity.company} • {opportunity.location}</p></td><td className="px-5 py-3 text-slate-600 capitalize">{opportunity.type?.replace('-', ' ')}</td><td className="px-5 py-3 text-slate-600">{opportunity.postedBy?.name || 'Account removed'}</td><td className="px-5 py-3 text-slate-500">{new Date(opportunity.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div> : <p className="p-8 text-sm text-slate-500">No user-posted opportunities yet.</p>}
          </section>
          <p className="text-xs text-slate-400">Showing latest 12 applications, 12 registrations, and 15 opportunities. Data refreshed {new Date(adminData.generatedAt).toLocaleTimeString()}.</p>
        </>
      )}
    </div>
  );

  const InternshipListings = () => (
    <div>
      <h2 className="text-2xl font-bold mb-2">Internships ({filterList('Internship').length})</h2>
      <p className="text-sm text-gray-400 mb-4">Browse current internships and track the ones you apply to.</p>
      {renderFeedStatus()}
      <input placeholder="Search internships..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-64 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filterList('Internship').map(h=><OppCard key={h.id} h={h} />)}</div>
      {!feedLoading && filterList('Internship').length===0 && <p className="text-sm text-gray-400 mt-4">No internship listings found in the connected feeds right now. Refresh later to check for new opportunities.</p>}
    </div>
  );

  if (active === 'Admin Dashboard') {
    if (!isAdmin) {
      return <main className="min-h-screen bg-slate-50 p-8 text-slate-700">Admin access required. Please sign in with an administrator account.</main>;
    }
    return (
      <div id="admin-dashboard" className="flex min-h-screen bg-[#e2f1ff] text-slate-900">
        <aside className="admin-sidebar w-64 shrink-0 bg-[#075985] border-r border-slate-200 p-4 hidden lg:flex flex-col"><AdminSidebarContent /></aside>
        {mobileOpen && <div className="fixed inset-0 z-40 flex lg:hidden"><div className="admin-sidebar w-64 bg-[#075985] border-r border-slate-200 p-4 flex flex-col"><AdminSidebarContent /></div><div className="flex-1 bg-slate-900/30" onClick={()=>setMobileOpen(false)} /></div>}
        <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto">
          <button onClick={()=>setMobileOpen(true)} className="lg:hidden mb-5 bg-white border border-slate-200 rounded-lg px-3 py-2">☰ Menu</button>
          {sessionError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{sessionError}</p>}
          <AdminDashboard />
        </main>
      </div>
    );
  }

  if (active === 'Add Opportunity' && !isAdmin) {
    return <main className="min-h-screen bg-slate-50 p-8 text-slate-700">Only administrators can post opportunities.</main>;
  }

  if (active!== 'Dashboard') {
    return (
      <div className="flex min-h-screen bg-[#080d1c] text-white">
        <aside className="w-64 bg-[#0b1224] border-r border-white/10 p-4 hidden lg:flex flex-col"><SidebarContent/></aside>
        {mobileOpen && <div className="fixed inset-0 z-40 flex"><div className="w-64 bg-[#0b1224] p-4 flex flex-col"><SidebarContent/></div><div className="flex-1 bg-black/50" onClick={()=>setMobileOpen(false)}></div></div>}
        <main className="flex-1 p-4 overflow-y-auto">
          <div className="flex gap-2 mb-4"><button onClick={()=>setMobileOpen(true)} className="lg:hidden px-3 py-2 bg-white/10 rounded">☰</button><button onClick={()=>setActive(isAdmin ? 'Admin Dashboard' : 'Dashboard')} className="px-4 py-2 bg-white/10 rounded text-sm">← Home</button></div>
          {sessionError && <p role="alert" className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{sessionError}</p>}
          {(active==='Login' || active==='Register') && (
            <div className="max-w-md mx-auto bg-[#0f172d] border border-white/10 p-6 rounded-xl">
              <h2 className="text-2xl font-bold mb-2">{active === 'Register' ? 'Create your account' : 'Welcome back'}</h2>
              <p className="text-sm text-gray-400 mb-6">{active === 'Register' ? 'Register to set up your developer profile.' : 'Login to access your developer profile.'}</p>
              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {active === 'Register' && <input autoComplete="name" placeholder="Full Name" value={authForm.name} onChange={e=>setAuthForm({...authForm,name:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" />}
                <input type="email" autoComplete="email" placeholder="Email" value={authForm.email} onChange={e=>setAuthForm({...authForm,email:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                <input type="password" autoComplete={active === 'Register' ? 'new-password' : 'current-password'} placeholder="Password" value={authForm.password} onChange={e=>setAuthForm({...authForm,password:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                {authError && <p role="alert" className="text-sm text-red-400">{authError}</p>}
                <button type="submit" disabled={authLoading} className="w-full bg-blue-600 py-2.5 rounded-lg font-bold disabled:opacity-60">{authLoading ? 'Please wait...' : active}</button>
              </form>
              <p className="text-sm text-gray-400 mt-5">
                {active === 'Register' ? 'Already have an account? ' : "Don't have an account? "}
                <button onClick={()=>{setAuthError(''); setActive(active === 'Register' ? 'Login' : 'Register');}} className="text-blue-400 hover:text-blue-300">
                  {active === 'Register' ? 'Login' : 'Register'}
                </button>
              </p>
            </div>
          )}
          {active==='Internships' && <InternshipListings />}
          {active==='Track Workflow' && <TrackWorkflow />}
          {active==='Hackathons' && (<div><h2 className="text-2xl font-bold mb-2">Hackathons ({filterList('Hackathon').length})</h2><p className="text-sm text-gray-400 mb-4">Browse active hackathons and search by title, organizer, platform, location, or tags.</p>{renderFeedStatus()}<input type="search" aria-label="Search hackathons" placeholder="Search hackathons, organizers, platforms..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filterList('Hackathon').map(h=><OppCard key={h.id} h={h} />)}</div>{!feedLoading && filterList('Hackathon').length===0 && <p className="text-sm text-gray-400 mt-4">{searchQuery ? 'No hackathons match your search. Try a different title, organizer, platform, or keyword.' : 'No hackathon listings found in the connected feeds right now. Refresh later to check for new opportunities.'}</p>}</div>)}
          {active==='Open Source' && (<div><h2 className="text-2xl font-bold mb-2">Open Source ({filterList('Open Source').length})</h2><p className="text-sm text-gray-400 mb-4">Find beginner-friendly GitHub issues and open issues from GitLab projects found using a beginner-contribution search.</p>{renderFeedStatus()}<input type="search" aria-label="Search open-source issues" placeholder="Search issues, repositories, labels..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filterList('Open Source').map(h=><OppCard key={h.id} h={h} />)}</div>{!feedLoading && filterList('Open Source').length===0 && <p className="text-sm text-gray-400 mt-4">{searchQuery ? 'No open-source issues match your search. Try a different issue, repository, or label.' : 'No open-source issues found in the connected feeds right now. Refresh later to check again.'}</p>}</div>)}
          {active==='Jobs' && (<div><h2 className="text-2xl font-bold mb-2">Jobs ({filterList('Job').length})</h2><p className="text-sm text-gray-400 mb-4">Search by job title, company, location, or skill.</p>{renderFeedStatus()}<input type="search" aria-label="Search jobs" placeholder="Search jobs, companies, locations..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4" /><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filterList('Job').map(h=><OppCard key={h.id} h={h} />)}</div>{!feedLoading && filterList('Job').length===0 && <p className="text-sm text-gray-400 mt-4">{searchQuery ? 'No jobs match your search. Try a different title, company, location, or keyword.' : 'No job listings found in the connected feeds right now. Refresh later to check for new opportunities.'}</p>}</div>)}
          {active==='Scholarships' && (<div><h2 className="text-2xl font-bold mb-4">Scholarships ({filterList('Scholarship').length})</h2>{renderFeedStatus()}<div className="grid grid-cols-1 md:grid-cols-2 gap-4">{filterList('Scholarship').map(h=><OppCard key={h.id} h={h} />)}</div>{!feedLoading && filterList('Scholarship').length===0 && <p className="text-sm text-gray-400 mt-4">No scholarship listings found in the connected feed right now. Refresh later to check for new opportunities.</p>}</div>)}
          {active==='Saved Opportunities' && (<div><h2 className="text-2xl font-bold mb-4">Saved ({saved.length})</h2><div className="grid gap-3">{saved.map(s=><div key={s.id} className="bg-[#0f172d] p-4 rounded-xl flex justify-between"><p className="text-sm font-bold">{s.title}</p><div className="flex gap-2"><button onClick={()=>addApplication(s)} className="text-xs bg-blue-600 px-3 py-1 rounded">Track</button><button onClick={()=>toggleSave(s)} className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded">Remove</button></div></div>)}</div></div>)}
          {isAuthenticated && active==='Profile' && (
            <div className="max-w-4xl mx-auto space-y-5">
              {editingProfile ? (
                <form onSubmit={saveProfile} className="space-y-5">
                  <div className="bg-blue-950/50 border border-blue-400/20 p-4 rounded-xl">
                    <div className="flex justify-between text-xs mb-2"><span className="text-gray-300">Profile completeness</span><span className="text-blue-200">{profileCompleteness}%</span></div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full transition-all" style={{width:`${profileCompleteness}%`}} /></div>
                  </div>
                  <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                    <div className="mb-5"><p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Candidate profile</p><h2 className="text-2xl font-bold mt-2">Build your profile</h2><p className="text-sm text-gray-400 mt-1">Add the details recruiters usually look for.</p></div>
                    <h3 className="font-semibold mb-3">Personal details</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input placeholder="Full name" value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input type="email" placeholder="Email address" value={profile.email} onChange={e=>setProfile({...profile,email:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input type="tel" placeholder="Phone number" value={profile.phone || ''} onChange={e=>setProfile({...profile,phone:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input placeholder="City, State / Country" value={profile.location || ''} onChange={e=>setProfile({...profile,location:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    </div>
                  </section>

                  <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                    <h3 className="font-semibold mb-1">Education</h3><p className="text-xs text-gray-400 mb-4">Your current or most recent qualification</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <input placeholder="College / University" value={profile.college || ''} onChange={e=>setProfile({...profile,college:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input placeholder="Degree (e.g. B.Tech)" value={profile.degree || ''} onChange={e=>setProfile({...profile,degree:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input placeholder="Branch / Major" value={profile.branch || ''} onChange={e=>setProfile({...profile,branch:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <label className="text-xs text-gray-400">Expected graduation year<input type="number" min="2000" max="2100" placeholder="2027" value={profile.graduationYear || ''} onChange={e=>setProfile({...profile,graduationYear:e.target.value})} className="mt-1 w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm text-white" /></label>
                      <label className="text-xs text-gray-400">CGPA / SGPA (out of 10)<input type="number" min="0" max="10" step="0.01" placeholder="8.50" value={profile.cgpa || ''} onChange={e=>setProfile({...profile,cgpa:e.target.value})} className="mt-1 w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm text-white" /></label>
                    </div>
                  </section>

                  <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                    <div className="flex flex-wrap items-end justify-between gap-2 mb-4"><div><h3 className="font-semibold">Skills</h3><p className="text-xs text-gray-400 mt-1">Select all that apply. Click again to remove.</p></div><span className="text-xs text-blue-300">{profile.skills.length} selected</span></div>
                    <div className="space-y-5">
                      {Object.entries(skillGroups).map(([group, skills])=>(
                        <div key={group}>
                          <h4 className="text-xs font-semibold text-gray-400 mb-2">{group}</h4>
                          <div className="flex flex-wrap gap-2">
                            {skills.map(skill=>{
                              const selected = profile.skills.includes(skill);
                              return <button key={skill} type="button" aria-pressed={selected} onClick={()=>toggleProfileSelection('skills',skill)} className={`rounded-full border px-3 py-1.5 text-xs transition ${selected ? 'bg-blue-600/25 border-blue-400 text-blue-200' : 'bg-[#080d1c] border-white/10 text-gray-300 hover:border-blue-400/60'}`}>{selected ? '✓ ' : '+ '}{skill}</button>;
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <form onSubmit={addCustomSkill} className="mt-5">
                      <label htmlFor="custom-skill" className="text-xs font-semibold text-gray-300">Can’t find your skill? Add a custom skill</label>
                      <div className="flex gap-2 mt-2">
                        <input id="custom-skill" placeholder="e.g. Solidity, Blender, SAP" value={newSkill} onChange={e=>setNewSkill(e.target.value)} className="min-w-0 flex-1 bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" />
                        <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-4 rounded-lg text-sm font-semibold">Add skill</button>
                      </div>
                    </form>
                    {profile.skills.some(skill=>!knownSkills.includes(skill)) && <div className="mt-4"><p className="text-xs text-gray-400 mb-2">Your custom skills (click to remove)</p><div className="flex flex-wrap gap-2">{profile.skills.filter(skill=>!knownSkills.includes(skill)).map(skill=><button key={skill} type="button" onClick={()=>toggleProfileSelection('skills',skill)} className="rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">{skill} ×</button>)}</div></div>}
                  </section>

                  <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                    <h3 className="font-semibold mb-1">Experience & job preferences</h3><p className="text-xs text-gray-400 mb-4">Internship, project, freelance or full-time experience</p>
                    <div className="grid sm:grid-cols-2 gap-3 mb-5">
                      <select value={profile.experience || ''} onChange={e=>setProfile({...profile,experience:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300"><option value="">Experience level</option><option>Student / Fresher</option><option>Internship experience</option><option>Less than 1 year</option><option>1-3 years</option><option>3+ years</option></select>
                      <select value={profile.workPreference || ''} onChange={e=>setProfile({...profile,workPreference:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm text-gray-300"><option value="">Work preference</option><option>On-site</option><option>Hybrid</option><option>Remote</option><option>Open to all</option></select>
                    </div>
                    <textarea placeholder="Experience highlights: role, organization, dates, and what you accomplished" rows={3} value={profile.experienceDetails || ''} onChange={e=>setProfile({...profile,experienceDetails:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm mb-4" />
                    <div className="grid sm:grid-cols-2 gap-3 mb-5">
                      <textarea placeholder="Projects: what you built, your role, and impact" rows={4} value={profile.projects || ''} onChange={e=>setProfile({...profile,projects:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <textarea placeholder="Certifications, awards, or achievements" rows={4} value={profile.certifications || ''} onChange={e=>setProfile({...profile,certifications:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    </div>
                    <h4 className="text-xs font-semibold text-gray-400 mb-2">Roles you are interested in</h4>
                    <div className="flex flex-wrap gap-2">
                      {roleOptions.map(role=>{
                        const selected = profile.preferredRoles.includes(role);
                        return <button key={role} type="button" aria-pressed={selected} onClick={()=>toggleProfileSelection('preferredRoles',role)} className={`rounded-full border px-3 py-1.5 text-xs transition ${selected ? 'bg-purple-600/25 border-purple-400 text-purple-200' : 'bg-[#080d1c] border-white/10 text-gray-300 hover:border-purple-400/60'}`}>{selected ? '✓ ' : '+ '}{role}</button>;
                      })}
                    </div>
                  </section>

                  <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                    <h3 className="font-semibold mb-1">Links & about</h3><p className="text-xs text-gray-400 mb-4">Help employers learn more about you and your work</p>
                    <div className="grid sm:grid-cols-2 gap-3 mb-3">
                      <input type="url" placeholder="GitHub profile URL" value={profile.github || ''} onChange={e=>setProfile({...profile,github:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input type="url" placeholder="LinkedIn profile URL" value={profile.linkedin || ''} onChange={e=>setProfile({...profile,linkedin:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input type="url" placeholder="Portfolio / personal website URL" value={profile.portfolio || ''} onChange={e=>setProfile({...profile,portfolio:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                      <input type="url" placeholder="Resume link (Google Drive, etc.)" value={profile.resume || ''} onChange={e=>setProfile({...profile,resume:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    </div>
                    <textarea placeholder="Short bio: introduce yourself, your goals, and what you have built..." rows={4} value={profile.bio || ''} onChange={e=>setProfile({...profile,bio:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  </section>
                  <div className="flex gap-3 sticky bottom-3 bg-[#080d1c]/90 backdrop-blur p-3 rounded-xl border border-white/10">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-semibold">Save Profile</button>
                    <button type="button" onClick={cancelProfileEdit} className="bg-white/10 hover:bg-white/15 px-5 py-2.5 rounded-lg text-sm">Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-[#111a35] to-[#0f172d] border border-blue-400/20 p-6 md:p-8 rounded-2xl">
                    <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl"></div>
                    <div className="relative flex flex-wrap items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl bg-blue-500/20 border border-blue-300/30 flex items-center justify-center text-3xl font-extrabold text-blue-200">{(profile.name || user?.name || 'U').split(' ').map(part=>part[0]).slice(0,2).join('').toUpperCase()}</div>
                      <div className="flex-1 min-w-[200px]"><p className="text-xs uppercase tracking-[0.2em] text-blue-300 font-bold">Candidate profile</p><h2 className="text-3xl font-bold mt-1">{profile.name || user?.name || 'Your name'}</h2><p className="text-sm text-gray-300 mt-1">{profile.degree}{profile.branch ? ` • ${profile.branch}` : ''}{profile.college ? ` • ${profile.college}` : ''}</p><p className="text-xs text-gray-400 mt-1">{profile.location || 'Add your location'}{profile.graduationYear ? ` • Class of ${profile.graduationYear}` : ''}</p></div>
                      <button onClick={()=>setEditingProfile(true)} className="bg-blue-600 hover:bg-blue-500 px-4 py-2.5 rounded-lg text-sm font-semibold">Edit Profile</button>
                    </div>
                    <div className="relative mt-6">
                      <div className="flex justify-between text-xs mb-2"><span className="text-gray-300">Profile completeness</span><span className="text-blue-200">{profileCompleteness}%</span></div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-blue-500 to-cyan-300 rounded-full" style={{width:`${profileCompleteness}%`}} /></div>
                    </div>
                  </section>
                  <div className="grid md:grid-cols-2 gap-5">
                    <section className="bg-[#0f172d] border border-white/10 p-5 rounded-2xl"><h3 className="font-semibold mb-4">Contact</h3><div className="space-y-3 text-sm"><p><span className="text-gray-500 block text-xs mb-1">Email</span>{profile.email || user?.email || 'Not added'}</p><p><span className="text-gray-500 block text-xs mb-1">Phone</span>{profile.phone || 'Not added'}</p><p><span className="text-gray-500 block text-xs mb-1">Location</span>{profile.location || 'Not added'}</p></div></section>
                    <section className="bg-[#0f172d] border border-white/10 p-5 rounded-2xl"><h3 className="font-semibold mb-4">Education</h3><div className="space-y-3 text-sm"><p><span className="text-gray-500 block text-xs mb-1">College</span>{profile.college || 'Not added'}</p><p><span className="text-gray-500 block text-xs mb-1">Degree & major</span>{[profile.degree,profile.branch].filter(Boolean).join(' • ') || 'Not added'}</p><p><span className="text-gray-500 block text-xs mb-1">CGPA / SGPA</span>{profile.cgpa ? `${profile.cgpa} / 10` : 'Not added'}{profile.graduationYear ? ` • Graduation ${profile.graduationYear}` : ''}</p></div></section>
                  </div>
                  <section className="bg-[#0f172d] border border-white/10 p-5 rounded-2xl"><h3 className="font-semibold mb-3">Skills</h3>{profile.skills.length ? <div className="flex flex-wrap gap-2">{profile.skills.map(skill=><span key={skill} className="bg-blue-500/10 border border-blue-400/20 text-blue-200 px-3 py-1.5 rounded-full text-xs">{skill}</span>)}</div> : <p className="text-sm text-gray-500">Select your skills to help recruiters find you.</p>}</section>
                  <section className="bg-[#0f172d] border border-white/10 p-5 rounded-2xl"><h3 className="font-semibold mb-3">Experience, projects & preferences</h3><div className="grid sm:grid-cols-2 gap-4 text-sm"><p><span className="text-gray-500 block text-xs mb-1">Experience</span>{profile.experience || 'Not added'}</p><p><span className="text-gray-500 block text-xs mb-1">Work preference</span>{profile.workPreference || 'Not added'}</p><div className="sm:col-span-2"><span className="text-gray-500 block text-xs mb-1">Experience highlights</span><p className="whitespace-pre-wrap">{profile.experienceDetails || 'Not added'}</p></div><div><span className="text-gray-500 block text-xs mb-1">Projects</span><p className="whitespace-pre-wrap">{profile.projects || 'Not added'}</p></div><div><span className="text-gray-500 block text-xs mb-1">Certifications & achievements</span><p className="whitespace-pre-wrap">{profile.certifications || 'Not added'}</p></div><div className="sm:col-span-2"><span className="text-gray-500 block text-xs mb-2">Interested roles</span>{profile.preferredRoles.length ? <div className="flex flex-wrap gap-2">{profile.preferredRoles.map(role=><span key={role} className="bg-purple-500/10 border border-purple-400/20 text-purple-200 px-3 py-1.5 rounded-full text-xs">{role}</span>)}</div> : <span className="text-gray-500">Choose roles you are interested in.</span>}</div></div></section>
                  <section className="bg-[#0f172d] border border-white/10 p-5 rounded-2xl"><h3 className="font-semibold mb-3">About & links</h3><p className="text-sm text-gray-300 whitespace-pre-wrap">{profile.bio || 'Add a short introduction about yourself.'}</p><div className="flex flex-wrap gap-3 mt-4 text-sm">{[['GitHub',profile.github],['LinkedIn',profile.linkedin],['Portfolio',profile.portfolio],['Resume',profile.resume]].filter(([,url])=>url).map(([label,url])=><a key={label} href={url} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200 underline underline-offset-4">{label} ↗</a>)}</div></section>
                  <div className="bg-[#0f172d] border border-white/10 p-4 rounded-xl text-sm text-gray-400">Activity: {totalXP} XP • {applications.length} applications tracked • {saved.length} opportunities saved</div>
                </>
              )}
            </div>
          )}
          {active==='Add Opportunity' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <section className="bg-[#0f172d] border border-white/10 p-6 rounded-2xl">
                <h2 className="text-2xl font-bold">Post an opportunity</h2>
                <p className="text-sm text-gray-400 mt-1 mb-5">Your opportunity will be saved to your account and shown here after posting.</p>
                {isAuthenticated ? (
                  <form onSubmit={handleAddOpp} className="grid md:grid-cols-2 gap-3">
                    <input placeholder="Opportunity title" value={newOpp.title} onChange={e=>setNewOpp({...newOpp,title:e.target.value})} required className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    <input placeholder="Company / organization" value={newOpp.company} onChange={e=>setNewOpp({...newOpp,company:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    <select value={newOpp.type} onChange={e=>setNewOpp({...newOpp,type:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm"><option>Internship</option><option>Job</option><option>Scholarship</option><option>Hackathon</option><option>Open Source</option></select>
                    <input placeholder="Location (e.g. Remote, Mumbai)" value={newOpp.loc} onChange={e=>setNewOpp({...newOpp,loc:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                    <input type="url" placeholder="External details / application URL (optional)" value={newOpp.link} onChange={e=>setNewOpp({...newOpp,link:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm md:col-span-2" />
                    <textarea placeholder="Description and requirements" rows={4} value={newOpp.description} onChange={e=>setNewOpp({...newOpp,description:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm md:col-span-2" />
                    <input placeholder="Skills / tags (comma separated)" value={newOpp.tags} onChange={e=>setNewOpp({...newOpp,tags:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm md:col-span-2" />
                    {myOppsError && <p role="alert" className="text-sm text-red-400 md:col-span-2">{myOppsError}</p>}
                    <button type="submit" disabled={addingOpp} className="bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 rounded-lg text-sm font-semibold md:col-span-2">{addingOpp ? 'Posting…' : 'Post Opportunity'}</button>
                  </form>
                ) : <p className="text-sm text-amber-300">Please log in before you post an opportunity.</p>}
              </section>
              <section>
                <div className="flex items-center justify-between mb-4"><div><h2 className="text-xl font-bold">My posted opportunities</h2><p className="text-xs text-gray-400 mt-1">Manage, delete or review applications for your listings.</p></div><span className="text-xs text-gray-400">{displayedMyOpps.length} total</span></div>
                {myOppsError && <p role="alert" className="text-sm text-red-400 mb-3">{myOppsError}</p>}
                {displayedMyOpps.length ? <div className="grid md:grid-cols-2 gap-4">{displayedMyOpps.map(opportunity=>(
                  <div key={opportunity.id} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl">
                    <div className="flex items-start justify-between gap-3"><div><span className="text-[10px] uppercase tracking-wide text-blue-300">{opportunity.type}</span><h3 className="font-bold mt-1">{opportunity.title}</h3><p className="text-xs text-gray-400 mt-1">{opportunity.company ? `${opportunity.company} • ` : ''}{opportunity.loc}</p></div><button onClick={()=>deleteMyOpportunity(opportunity)} className="shrink-0 text-xs border border-red-400/30 text-red-300 hover:bg-red-500/10 px-3 py-2 rounded-lg">Delete</button></div>
                    {opportunity.description && <p className="text-sm text-gray-400 mt-3 line-clamp-3">{opportunity.description}</p>}
                    {!!opportunity.tags.length && <div className="flex flex-wrap gap-2 mt-3">{opportunity.tags.map(tag=><span key={tag} className="text-[11px] bg-white/10 px-2 py-1 rounded-full">{tag}</span>)}</div>}
                    <div className="flex gap-2 mt-4"><button onClick={()=>openApplyForm(opportunity)} className="text-xs bg-blue-600 hover:bg-blue-500 px-3 py-2 rounded-lg">Apply with form</button>{opportunity.link && <a href={opportunity.link} target="_blank" rel="noreferrer" className="text-xs bg-white/10 px-3 py-2 rounded-lg">Details ↗</a>}</div>
                  </div>
                ))}</div> : <div className="border border-dashed border-white/15 rounded-xl p-8 text-center text-sm text-gray-400">{isAuthenticated ? 'You have not posted any opportunities yet.' : 'Log in to see your posted opportunities.'}</div>}
              </section>
            </div>
          )}
          {applyTarget && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget){setApplyTarget(null);setApplyError('');}}}>
              <section role="dialog" aria-modal="true" aria-labelledby="application-title" className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#0f172d] border border-white/10 rounded-2xl p-6">
                <div className="flex justify-between items-start gap-4 mb-5"><div><h2 id="application-title" className="text-xl font-bold">Apply for {applyTarget.title}</h2><p className="text-sm text-gray-400 mt-1">{applyTarget.company || 'Opportunity'} • {applyTarget.loc}</p></div><button onClick={()=>{setApplyTarget(null);setApplyError('');}} aria-label="Close application form" className="text-gray-400 hover:text-white">✕</button></div>
                <form onSubmit={submitApplication} className="space-y-3">
                  <input placeholder="Full name" value={applyForm.name} onChange={e=>setApplyForm({...applyForm,name:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  <input type="email" placeholder="Email" value={applyForm.email} onChange={e=>setApplyForm({...applyForm,email:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  <input type="tel" placeholder="Phone" value={applyForm.phone} onChange={e=>setApplyForm({...applyForm,phone:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  <input type="url" placeholder="Resume URL (https://…)" value={applyForm.resume} onChange={e=>setApplyForm({...applyForm,resume:e.target.value})} required className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  <textarea placeholder="Cover letter / note (optional)" rows={4} value={applyForm.coverLetter} onChange={e=>setApplyForm({...applyForm,coverLetter:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-3 text-sm" />
                  {applyError && <p role="alert" className="text-sm text-red-400">{applyError}</p>}
                  <button type="submit" disabled={applying} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-3 rounded-lg font-semibold">{applying ? 'Submitting…' : 'Submit application'}</button>
                </form>
              </section>
            </div>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080d1c] text-white">
      <aside className="w-64 bg-[#0b1224] border-r border-white/10 p-4 hidden lg:flex flex-col"><SidebarContent/></aside>
      {mobileOpen && <div className="fixed inset-0 z-40 flex"><div className="w-64 bg-[#0b1224] p-4 flex flex-col"><SidebarContent/></div><div className="flex-1 bg-black/50" onClick={()=>setMobileOpen(false)}></div></div>}
      <main className="flex-1 p-4 md:p-6">
        <button onClick={()=>setMobileOpen(true)} className="lg:hidden px-3 py-2 bg-white/10 rounded mb-4">☰ Menu</button>
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-blue-700">User dashboard</p>
        <h2 className="text-4xl font-extrabold">Good morning {(user?.name || profile.name || '').trim().split(/\s+/)[0]}</h2>
        <p className="text-gray-400 text-sm mt-1">Level {Math.floor(totalXP/100)+1} • {totalXP} XP • {applications.length} in Track Workflow</p>
        <div className="w-full bg-white/10 h-2 rounded-full my-4 max-w-md"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{width:`${totalXP%100}%`}}></div></div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
          <div onClick={()=>setActive('Internships')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Internships</h4><p className="text-xs text-gray-400 mt-2">{allOpportunities.filter(o=>o.type==='Internship').length} live listings</p></div>
          <div onClick={()=>setActive('Jobs')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer"><h4 className="font-bold text-sm">Jobs</h4><p className="text-xs text-gray-400 mt-2">{allOpportunities.filter(o=>o.type==='Job').length} live listings</p></div>
          <div onClick={()=>setActive('Scholarships')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer"><h4 className="font-bold text-sm">Scholarships</h4><p className="text-xs text-gray-400 mt-2">{allOpportunities.filter(o=>o.type==='Scholarship').length} live listings</p></div>
          <div onClick={()=>setActive('Track Workflow')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Track Workflow</h4><p className="text-xs text-gray-400 mt-2">{applications.length} tracked</p></div>
          <div onClick={()=>setActive('Profile')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer"><h4 className="font-bold text-sm">Profile</h4><p className="text-xs text-gray-400 mt-2">{profileCompleteness}% complete</p></div>
          <div onClick={()=>setActive('Hackathons')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer"><h4 className="font-bold text-sm">Hackathons</h4><p className="text-xs text-gray-400 mt-2">{allOpportunities.filter(o=>o.type==='Hackathon').length} active</p></div>
          <div onClick={()=>setActive('Saved Opportunities')} className="bg-[#0f172d] border border-white/10 p-5 rounded-xl cursor-pointer"><h4 className="font-bold text-sm">Saved</h4><p className="text-xs text-gray-400 mt-2">{saved.length} saved</p></div>
        </div>
        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4"><h3 className="text-xl font-bold">Fresh opportunities</h3><button onClick={()=>setActive('Jobs')} className="text-sm text-blue-300 hover:text-blue-200">Browse all jobs & internships →</button></div>
          {renderFeedStatus()}
          {feedLoading && <p className="text-sm text-gray-400">Fetching current listings…</p>}
          {!feedLoading && liveOpps.length === 0 && <p className="text-sm text-gray-400">No live listings are available right now. Use Refresh feeds to try again.</p>}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{liveOpps.slice(0,6).map(opportunity=><OppCard key={opportunity.id} h={opportunity} />)}</div>
        </div>
        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div><h3 className="text-xl font-bold">Hackathons ({filterList('Hackathon').length})</h3><p className="text-sm text-gray-400 mt-1">Upcoming events from Brabble.ai and connected feeds</p></div>
            <button onClick={()=>setActive('Hackathons')} className="text-sm text-blue-300 hover:text-blue-200">Browse all hackathons →</button>
          </div>
          <input type="search" aria-label="Search hackathons on dashboard" placeholder="Search hackathons, organizers, platforms..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-full max-w-md mb-4" />
          {!feedLoading && filterList('Hackathon').length === 0 && <p className="text-sm text-gray-400 mb-4">{searchQuery ? 'No hackathons match your search. Try another keyword.' : 'No hackathon listings are available right now.'}</p>}
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">{filterList('Hackathon').slice(0,6).map(opportunity=><OppCard key={opportunity.id} h={opportunity} />)}</div>
        </section>
      </main>
    </div>
  );
}

export default App;