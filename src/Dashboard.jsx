import React, { useState, useEffect } from 'react';

export default function Dashboard({ setPage }) {
  const [active, setActive] = useState('Dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState({ name:'', email:'', college:'', github:'', skills:'', bio:'' });
  const [saved, setSaved] = useState([]);
  const [applications, setApplications] = useState([]);
  const [customOpps, setCustomOpps] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [newOpp, setNewOpp] = useState({ title:'', type:'Internship', loc:'Remote', link:'', tags:'' });

  const baseOpportunities = [
    { id:1, title:'Frontend Intern @ Google', type:'Internship', loc:'Remote', deadline:'2 days left', tags:['React','Remote'] },
    { id:2, title:'ETHGlobal Hackathon', type:'Hackathon', loc:'Bangalore', deadline:'5 days left', tags:['Web3','Beginner Friendly'] },
    { id:3, title:'GSoC - React Org', type:'Open Source', loc:'Remote', deadline:'1 week left', tags:['Open Source','Remote'] },
    { id:4, title:'SDE Intern @ Microsoft', type:'Internship', loc:'Hyderabad', deadline:'3 days left', tags:['DSA','In-person'] },
    { id:5, title:'MLH Global Hack Week', type:'Hackathon', loc:'Remote', deadline:'1 day left', tags:['Beginner Friendly','Remote'] },
    { id:6, title:'Smart India Hackathon', type:'Hackathon', loc:'Delhi', deadline:'10 days left', tags:['In-person','Government'] },
    { id:7, title:'FOSS United Contributor', type:'Open Source', loc:'Remote', deadline:'Ongoing', tags:['Open Source','Beginner Friendly'] },
    { id:8, title:'Product Intern @ Razorpay', type:'Internship', loc:'Bangalore', deadline:'4 days left', tags:['Product','In-person'] },
    { id:9, title:'Backend Role @ Swiggy (New Grad)', type:'Job', loc:'Bangalore', deadline:'6 days left', tags:['Backend','In-person'] },
    { id:10, title:'Google STEP Scholarship', type:'Scholarship', loc:'Remote', deadline:'15 days left', tags:['Scholarship','Beginner Friendly'] },
  ];

  const allOpportunities = [...baseOpportunities,...customOpps];

  useEffect(()=>{
    const sp = localStorage.getItem('studentProfile'); if(sp) setProfile(JSON.parse(sp));
    const sv = localStorage.getItem('savedOpps'); if(sv) setSaved(JSON.parse(sv));
    const ap = localStorage.getItem('applications'); if(ap) setApplications(JSON.parse(ap));
    const co = localStorage.getItem('customOpps'); if(co) setCustomOpps(JSON.parse(co));
  },[]);

  const handleSaveProfile = () => { localStorage.setItem('studentProfile', JSON.stringify(profile)); alert('Profile Saved!'); setActive('Developer Profile'); };
  const toggleSave = (opp) => { let ns = saved.find(s=>s.id===opp.id)? saved.filter(s=>s.id!==opp.id) : [...saved, opp]; setSaved(ns); localStorage.setItem('savedOpps', JSON.stringify(ns)); };
  const addApplication = (opp) => { if(applications.find(a=>a.id===opp.id)) return alert('Already tracked'); const na = [...applications, {...opp, stage:'Applied'}]; setApplications(na); localStorage.setItem('applications', JSON.stringify(na)); setActive('Internships'); };
  const moveStage = (id, ns) => { const up = applications.map(a=> a.id===id? {...a, stage:ns} : a); setApplications(up); localStorage.setItem('applications', JSON.stringify(up)); };
  const handleAddOpp = () => {
    if(!newOpp.title ||!newOpp.link) return alert('Title & Link required');
    const opp = { id: Date.now(), title: newOpp.title, type: newOpp.type, loc: newOpp.loc, deadline: 'Just added', tags: newOpp.tags.split(',').map(t=>t.trim()).filter(Boolean), link: newOpp.link };
    const updated = [...customOpps, opp]; setCustomOpps(updated); localStorage.setItem('customOpps', JSON.stringify(updated));
    setNewOpp({ title:'', type:'Internship', loc:'Remote', link:'', tags:'' }); alert('Opportunity Added! +50 XP'); setActive(newOpp.type==='Hackathon'?'Hackathons': newOpp.type==='Open Source'?'Open Source' : newOpp.type==='Job'?'Jobs':'Internships');
  };

  const filterList = (type) => allOpportunities.filter(o => o.type===type).filter(h => {
    const ms = h.title.toLowerCase().includes(searchQuery.toLowerCase());
    const mf = filterType==='All' || h.tags.includes(filterType) || h.loc===filterType;
    return ms && mf;
  });

  const totalXP = applications.length*35 + saved.length*10 + customOpps.length*50 + (profile.name?50:0);
  const stats = [
    { label: 'Profile Completeness', value: profile.name? '100%':'94%', color: 'text-green-400' },
    { label: 'Tracked Applications', value: applications.length.toString(), color: 'text-white' },
    { label: 'Total XP', value: totalXP.toString(), color: 'text-yellow-400' },
    { label: 'Saved', value: saved.length.toString(), color: 'text-blue-400' },
    { label: 'Added', value: customOpps.length.toString(), color: 'text-purple-400' },
  ];

  const sidebar = ['Dashboard','Internships','Hackathons','Open Source','Jobs','Scholarships','Saved Opportunities','Roadmaps','Developer Profile','Setup Profile','Add Opportunity'];
  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-8 px-2"><h1 className="text-xl font-extrabold">OpportunityOS</h1><span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-bold">ADMIN</span></div>
      <div className="space-y-1 flex-1 overflow-y-auto">
        {sidebar.map((item) => (
          <div key={item} onClick={() => { setActive(item); setMobileOpen(false); setSearchQuery(''); setFilterType('All'); }} className={`px-3 py-2 rounded-lg text-sm cursor-pointer ${active===item? 'bg-blue-600 text-white font-semibold':'text-gray-400 hover:bg-white/5 hover:text-white'}`}>{item}</div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-white/5 rounded-lg text-xs"><p className="text-gray-400">Level {Math.floor(totalXP/100)+1}</p><div className="w-full bg-white/10 h-2 rounded-full mt-2"><div className="bg-blue-600 h-2 rounded-full" style={{width:`${totalXP%100}%`}}></div></div><p className="mt-1">{totalXP} XP • {applications.length} Applied</p></div>
    </>
  );

  const OppCard = ({ h }) => (
    <div className="bg-[#0f172d] border border-white/10 p-5 rounded-xl hover:border-blue-500/30 transition">
      <div className="flex justify-between items-start"><h3 className="font-bold text-sm pr-2">{h.title}</h3><span className="text-[10px] bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full shrink-0">{h.deadline}</span></div>
      <p className="text-xs text-gray-400 mt-1">{h.loc} • {h.type} • {h.tags.join(' • ')}</p>
      <div className="flex gap-2 mt-3"><button onClick={()=>toggleSave(h)} className={`text-xs px-3 py-1.5 rounded-lg ${saved.find(s=>s.id===h.id)?'bg-green-600/20 text-green-300':'bg-white/10'}`}>{saved.find(s=>s.id===h.id)?'Saved ✓':'Save'}</button><button onClick={()=>addApplication(h)} className="text-xs bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700">Track +35 XP</button>{h.link && <a href={h.link} target="_blank" rel="noreferrer" className="text-xs bg-white/5 px-3 py-1.5 rounded-lg">Link ↗</a>}</div>
    </div>
  );

  const ListPage = ({ type, title }) => {
    const list = filterList(type);
    return (
      <div>
        <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{title} ({list.length})</h2>
          <div className="flex gap-2"><input placeholder={`Search ${title}...`} value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm w-56" /><select value={filterType} onChange={e=>setFilterType(e.target.value)} className="bg-[#0f172d] border border-white/10 rounded-lg px-3 py-2 text-sm"><option>All</option><option>Remote</option><option>Beginner Friendly</option><option>In-person</option><option>Web3</option><option>Open Source</option></select></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{list.map(h=><OppCard key={h.id} h={h} />)}</div>
        {list.length===0 && <p className="text-center text-gray-400 mt-10 text-sm">No {title} found for "{searchQuery}"</p>}
      </div>
    );
  };

  if (active!== 'Dashboard') {
    return (
      <div className="flex min-h-screen bg-[#080d1c] text-white font-sans">
        <aside className="w-64 shrink-0 bg-[#0b1224] border-r border-white/10 p-4 hidden lg:flex flex-col"><SidebarContent/></aside>
        {mobileOpen && <div className="fixed inset-0 z-40 flex"><div className="w-64 bg-[#0b1224] border-r border-white/10 p-4 flex flex-col"><SidebarContent/></div><div className="flex-1 bg-black/50" onClick={()=>setMobileOpen(false)}></div></div>}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="flex gap-3 mb-6"><button onClick={()=>setMobileOpen(true)} className="lg:hidden px-3 py-2 bg-white/10 rounded-lg">☰</button><button onClick={() => setActive('Dashboard')} className="px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 text-sm">← Home</button></div>
          {active === 'Setup Profile' && (<div className="max-w-2xl mx-auto bg-[#0f172d] border border-white/10 p-6 rounded-xl"><h2 className="text-2xl font-bold mb-4">Student Profile</h2><div className="space-y-4"><input placeholder="Full Name" value={profile.name} onChange={e=>setProfile({...profile, name:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><input placeholder="Email" value={profile.email} onChange={e=>setProfile({...profile, email:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><input placeholder="College" value={profile.college} onChange={e=>setProfile({...profile, college:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><input placeholder="GitHub Link" value={profile.github} onChange={e=>setProfile({...profile, github:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><input placeholder="Skills (React, Node...)" value={profile.skills} onChange={e=>setProfile({...profile, skills:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><textarea placeholder="Bio" rows={3} value={profile.bio} onChange={e=>setProfile({...profile, bio:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm"></textarea><button onClick={handleSaveProfile} className="w-full bg-purple-600 py-2.5 rounded-lg font-bold">Save Profile +50 XP</button></div></div>)}
          {active === 'Developer Profile' && (<div className="max-w-2xl mx-auto bg-[#0f172d] border border-white/10 p-6 rounded-xl"><h2 className="text-2xl font-bold mb-4">Developer Profile</h2>{profile.name? <div className="space-y-2 text-sm"><p><span className="text-gray-400">Name:</span> {profile.name}</p><p><span className="text-gray-400">Email:</span> {profile.email}</p><p><span className="text-gray-400">College:</span> {profile.college}</p><p><span className="text-gray-400">Skills:</span> {profile.skills}</p><p><span className="text-gray-400">XP:</span> {totalXP}</p><button onClick={()=>setActive('Setup Profile')} className="mt-4 bg-blue-600 px-4 py-2 rounded-lg text-sm">Edit Profile</button></div> : <p className="text-gray-400 text-sm">No profile yet. <span onClick={()=>setActive('Setup Profile')} className="text-blue-400 cursor-pointer">Setup now</span></p>}</div>)}
          {active === 'Internships' && (<div><h2 className="text-2xl font-bold mb-4">Kanban - Tracked Applications ({applications.length})</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-4">{['Applied','Interview','Offer','Rejected'].map(stage=>(<div key={stage} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 min-h-[200px]"><h3 className="font-bold mb-3 text-sm">{stage} ({applications.filter(a=>a.stage===stage).length})</h3><div className="space-y-2">{applications.filter(a=>a.stage===stage).map(app=>(<div key={app.id} className="bg-[#080d1c] border border-white/10 p-3 rounded-lg text-xs"><p className="font-bold">{app.title}</p><p className="text-gray-400">{app.loc}</p><select value={app.stage} onChange={e=>moveStage(app.id, e.target.value)} className="mt-2 w-full bg-[#0f172d] border border-white/10 rounded px-2 py-1 text-xs"><option>Applied</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></div>))}</div></div>))}</div><div className="mt-8"><h3 className="font-bold mb-3">All Internships</h3><ListPage type="Internship" title="Internships" /></div></div>)}
          {active === 'Hackathons' && <ListPage type="Hackathon" title="Hackathons" />}
          {active === 'Open Source' && <ListPage type="Open Source" title="Open Source" />}
          {active === 'Jobs' && <ListPage type="Job" title="Jobs" />}
          {active === 'Scholarships' && <ListPage type="Scholarship" title="Scholarships" />}
          {active === 'Saved Opportunities' && (<div><h2 className="text-2xl font-bold mb-4">Saved ({saved.length}) - {saved.length*10} XP</h2>{saved.length===0? <p className="text-gray-400 text-sm">No saved yet. Go to Hackathons/Internships and save.</p> : <div className="grid gap-3">{saved.map(s=><div key={s.id} className="bg-[#0f172d] border border-white/10 p-4 rounded-xl flex justify-between"><div><p className="font-bold text-sm">{s.title}</p><p className="text-xs text-gray-400">{s.type} • {s.loc}</p></div><div className="flex gap-2"><button onClick={()=>addApplication(s)} className="text-xs bg-blue-600 px-3 py-1 rounded">Track</button><button onClick={()=>toggleSave(s)} className="text-xs bg-red-500/20 text-red-300 px-3 py-1 rounded">Remove</button></div></div>)}</div>}</div>)}
          {active === 'Roadmaps' && (<div className="max-w-2xl"><h2 className="text-2xl font-bold mb-4">Your Roadmap</h2><div className="space-y-3">{[{t:'Setup Profile',done:!!profile.name},{t:'Save 3 Opportunities',done:saved.length>=3},{t:'Track 1 Application',done:applications.length>=1},{t:'Add 1 Opportunity',done:customOpps.length>=1},{t:'Complete GitHub Link',done:!!profile.github}].map(item=><div key={item.t} className="bg-[#0f172d] border border-white/10 p-4 rounded-xl flex justify-between text-sm"><span>{item.t}</span><span className={item.done?'text-green-400':'text-gray-500'}>{item.done?'✓ Done':'○ Pending'}</span></div>)}</div></div>)}
          {active === 'Add Opportunity' && (<div className="max-w-2xl mx-auto bg-[#0f172d] border border-white/10 p-6 rounded-xl"><h2 className="text-2xl font-bold mb-4">Add Opportunity +50 XP</h2><div className="space-y-4"><input placeholder="Title e.g. Frontend Intern @ Google" value={newOpp.title} onChange={e=>setNewOpp({...newOpp, title:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><div className="grid grid-cols-2 gap-3"><select value={newOpp.type} onChange={e=>setNewOpp({...newOpp, type:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm"><option>Internship</option><option>Hackathon</option><option>Open Source</option><option>Job</option><option>Scholarship</option></select><select value={newOpp.loc} onChange={e=>setNewOpp({...newOpp, loc:e.target.value})} className="bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm"><option>Remote</option><option>Bangalore</option><option>Hyderabad</option><option>Delhi</option><option>Pune</option></select></div><input placeholder="Apply Link https://..." value={newOpp.link} onChange={e=>setNewOpp({...newOpp, link:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><input placeholder="Tags comma separated e.g. React, Remote, Beginner Friendly" value={newOpp.tags} onChange={e=>setNewOpp({...newOpp, tags:e.target.value})} className="w-full bg-[#080d1c] border border-white/10 rounded-lg px-4 py-2.5 text-sm" /><button onClick={handleAddOpp} className="w-full bg-blue-600 py-2.5 rounded-lg font-bold hover:bg-blue-700">Post Opportunity</button></div></div>)}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#080d1c] text-white font-sans">
      <aside className="w-64 shrink-0 bg-[#0b1224] border-r border-white/10 p-4 hidden lg:flex flex-col"><SidebarContent/></aside>
      {mobileOpen && <div className="fixed inset-0 z-40 flex"><div className="w-64 bg-[#0b1224] border-r border-white/10 p-4 flex flex-col"><SidebarContent/></div><div className="flex-1 bg-black/50" onClick={()=>setMobileOpen(false)}></div></div>}
      <main className="flex-1 p-4 md:p-6">
        <div className="flex gap-2 mb-4"><button onClick={()=>setMobileOpen(true)} className="lg:hidden px-3 py-2 bg-white/10 rounded-lg">☰</button><p className="text-sm text-gray-400">Workspace / <span className="text-white font-semibold">Dashboard</span></p></div>
        <h2 className="text-4xl font-extrabold mt-2">Good morning {profile.name?profile.name.split(' ')[0]:''}</h2>
        <p className="text-gray-400 text-sm mt-1 mb-3">Level {Math.floor(totalXP/100)+1} • {totalXP} XP</p>
        <div className="w-full bg-white/10 h-2 rounded-full mb-5 max-w-md"><div className="bg-blue-600 h-2 rounded-full transition-all" style={{width:`${totalXP%100}%`}}></div></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">{stats.map(s => (<div key={s.label} onClick={()=>setActive(s.label==='Saved'?'Saved Opportunities':'Roadmaps')} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20"><p className="text-xs text-gray-400">{s.label}</p><p className={`text-2xl font-extrabold mt-2 ${s.color}`}>{s.value}</p></div>))}</div>
        <div className="bg-[#0f172d]/50 border border-white/10 rounded-2xl p-5">
          <h3 className="font-bold mb-4">⚡ Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <div onClick={()=>setActive('Internships')} className="bg-[#0b1224] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Log Application</h4><p className="text-xs text-gray-400 mt-2">Kanban Board • {applications.length} tracked</p></div>
            <div onClick={()=>setActive('Developer Profile')} className="bg-[#0b1224] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Developer Profile</h4><p className="text-xs text-gray-400 mt-2">{profile.name? '100% complete':'Setup needed'} • {totalXP} XP</p></div>
            <div onClick={()=>setActive('Hackathons')} className="bg-[#0b1224] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Find Hackathons</h4><p className="text-xs text-gray-400 mt-2">{allOpportunities.filter(o=>o.type==='Hackathon').length} active</p></div>
            <div onClick={()=>setActive('Add Opportunity')} className="bg-[#0b1224] border border-white/10 rounded-xl p-5 cursor-pointer hover:border-blue-500/30"><h4 className="font-bold text-sm">Add Opportunity</h4><p className="text-xs text-gray-400 mt-2">Post • +50 XP</p></div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onClick={()=>setActive('Open Source')} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 cursor-pointer"><p className="text-sm font-bold">Open Source ({allOpportunities.filter(o=>o.type==='Open Source').length})</p><p className="text-xs text-gray-400 mt-1">GSoC, FOSS projects</p></div>
          <div onClick={()=>setActive('Jobs')} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 cursor-pointer"><p className="text-sm font-bold">Jobs ({allOpportunities.filter(o=>o.type==='Job').length})</p><p className="text-xs text-gray-400 mt-1">New grad roles</p></div>
          <div onClick={()=>setActive('Scholarships')} className="bg-[#0f172d] border border-white/10 rounded-xl p-4 cursor-pointer"><p className="text-sm font-bold">Scholarships ({allOpportunities.filter(o=>o.type==='Scholarship').length})</p><p className="text-xs text-gray-400 mt-1">Funding & grants</p></div>
        </div>
      </main>
    </div>
  );
}