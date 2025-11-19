import { useMemo, useState } from 'react'
import { Routes, Route, NavLink, Outlet, Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts'

// Single-file bundle of the CSR dashboard UI (layout + pages + data)
// Drop-in usage: import DashboardBundle from './dashboard/DashboardBundle';
// and mount <DashboardBundle /> somewhere, or share this single file.

// ---------- Shared UI helpers ----------
const NGO_LIST = [
  {
    id: 'ngo-101',
    name: 'Seva Foundation',
    location: 'Mumbai, Maharashtra',
    tagline: 'Healthcare access for all',
    verified: true,
    logo: '/images/logo2.jpg',
    focusAreas: ['Healthcare', 'Women Empowerment'],
    description: 'Seva Foundation works to expand access to quality primary healthcare in underserved communities across India.',
    contact: { email: 'contact@seva.org', phone: '+91 98765 43210' },
    projects: [
      { id: 'p1', name: 'Mobile Health Clinics', budget: '₹ 35,00,000', status: 'Active' },
      { id: 'p2', name: 'Maternal Care Initiative', budget: '₹ 22,00,000', status: 'Planned' },
    ],
  },
  {
    id: 'ngo-102',
    name: 'Shiksha Trust',
    location: 'Bengaluru, Karnataka',
    tagline: 'Quality education for every child',
    verified: true,
    logo: '/images/logo3.jpg',
    focusAreas: ['Education', 'Digital Literacy'],
    description: 'Shiksha Trust provides digital and remedial education programs for students in low-income communities.',
    contact: { email: 'hello@shiksha.org', phone: '+91 91234 56780' },
    projects: [
      { id: 'p1', name: 'Smart Classroom Program', budget: '₹ 18,00,000', status: 'Active' },
      { id: 'p2', name: 'After-School Learning Centers', budget: '₹ 27,50,000', status: 'Active' },
    ],
  },
  {
    id: 'ngo-103',
    name: 'Prakriti Collective',
    location: 'Jaipur, Rajasthan',
    tagline: 'Protecting people and planet',
    verified: false,
    logo: '/images/logo.jpg',
    focusAreas: ['Environment', 'Water'],
    description: 'Prakriti Collective focuses on water conservation, afforestation, and community-led climate resilience.',
    contact: { email: 'info@prakriti.org', phone: '+91 99876 54321' },
    projects: [
      { id: 'p1', name: 'Stepwell Restoration', budget: '₹ 12,00,000', status: 'Completed' },
      { id: 'p2', name: 'Urban Tree Plantation', budget: '₹ 9,50,000', status: 'Active' },
    ],
  },
]

function Breadcrumb({ items }){
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 transition-colors">Company Portal</Link>
      {items.map((item, i)=> (
        <div key={i} className="flex items-center space-x-2">
          <span className="text-gray-400">/</span>
          {item.href ? (
            <Link to={item.href} className="text-gray-500 hover:text-gray-700 transition-colors">{item.label}</Link>
          ) : (
            <span className="font-medium" style={{color:'var(--text-primary-color)'}}>{item.label}</span>
          )}
        </div>
      ))}
    </nav>
  )
}

function StatCard({ label, value, color, icon }){
  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xl" style={{background:`${color}20`}}>{icon}</div>
        <div className="text-2xl font-bold" style={{color:'var(--text-primary-color)'}}>{value}</div>
      </div>
      <div className="text-sm" style={{color:'var(--text-secondary-color)'}}>{label}</div>
    </div>
  )
}

function RecentActivity(){
  const ITEMS=[
    { id:1, text:'You sent a request to Seva Foundation', time:'2 hours ago', icon:'➕' },
    { id:2, text:'Shiksha Trust accepted your connection', time:'Yesterday', icon:'✔️' },
    { id:3, text:'Prakriti Collective updated a project', time:'2 days ago', icon:'🔄' },
  ]
  return (
    <div className="card-base p-5">
      <div className="flex items-center gap-2 mb-4"><span className="text-lg">ℹ️</span><div className="font-semibold" style={{color:'var(--text-primary-color)'}}>Recent Activity</div></div>
      <div className="relative">
        <div className="absolute left-4 top-0 bottom-0 w-0.5" style={{background:'var(--border-color)'}} />
        <ul className="space-y-4">
          {ITEMS.map(i=> (
            <li key={i.id} className="flex items-start gap-4 relative">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm relative z-10" style={{background:'var(--card-background-color)',border:'2px solid var(--border-color)'}}>{i.icon}</div>
              <div>
                <div className="text-sm" style={{color:'var(--text-secondary-color)'}}>{i.text}</div>
                <div className="text-xs text-gray-400 mt-1">{i.time}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function DonutChart(){
  const data=[
    { name:'Education', value:40 },
    { name:'Healthcare', value:30 },
    { name:'Environment', value:20 },
    { name:'Others', value:10 },
  ]
  const COLORS=['var(--primary-color)','var(--accent-color)','#f59e0b','#ef4444']
  return (
    <div className="card-base p-5">
      <div className="font-semibold mb-3" style={{color:'var(--text-primary-color)'}}>Investment by Focus Area</div>
      <div className="w-full h-72">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={100} innerRadius={60} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ---------- Layout ----------
function DashboardLayout(){
  const navItems=[
    { label:'Dashboard', to:'/dashboard' },
    { label:'Discover NGOs', to:'/dashboard/discover' },
    { label:'My Requests', to:'/dashboard/requests' },
    { label:'Reports', to:'/dashboard/reports' },
    { label:'My Profile', to:'/dashboard/profile' },
  ]
  return (
    <div className="min-h-screen dashboard-theme" style={{background:'var(--background-color)'}}>
      <div className="flex min-h-screen">
        <aside className="hidden md:block w-[260px] rounded-r-2xl" style={{background:'#ffffff',color:'#495057',borderRight:'1px solid var(--border-color)'}}>
          <div className="h-16 flex items-center px-5 border-b" style={{borderColor:'var(--border-color)'}}>
            <div className="text-xl font-bold" style={{color:'#172b4d'}}><span className="brand-gradient">CSR</span> Connect</div>
          </div>
          <nav className="py-4">
            <ul className="px-3 space-y-1">
              {navItems.map(item => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.to==='/dashboard'} className={({isActive}) => `sidebar-link flex items-center gap-3 px-4 py-2 rounded-md no-underline transition-all ${isActive?'accent-bar bg-gray-100':'hover:bg-gray-100'}`} style={({isActive})=>({color:isActive?'#172b4d':'#495057'})}>
                    <span className="text-sm font-medium" style={{opacity:1}}>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto p-4 hidden xl:block">
            <div className="rounded-lg border p-3 text-xs" style={{borderColor:'var(--border-color)',color:'#495057',background:'#ffffff'}}>Empowering impactful CSR partnerships.</div>
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <header className="navbar-enhanced flex items-center px-4 md:px-6 justify-between">
            <div className="hidden md:block">
              <div className="text-lg font-bold" style={{color:'var(--text-primary-color)'}}><span className="brand-gradient">CSR</span> Connect Dashboard</div>
              <div className="text-xs" style={{color:'var(--text-secondary-color)'}}>Company Portal</div>
            </div>
          </header>
          <main className="p-0 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

// ---------- Pages ----------
function DashboardHome(){
  const stats=[
    { label:'Pending Requests', value:4, color:'#f59e0b', icon:'📩' },
    { label:'Active Partnerships', value:12, color:'#10b981', icon:'🤝' },
    { label:'Total Investment', value:'₹ 2.4 Cr', color:'#6366f1', icon:'💰' },
  ]
  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <Breadcrumb items={[{label:'Dashboard'}]} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => <StatCard key={s.label} {...s} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RecentActivity />
        <DonutChart />
      </div>
    </div>
  )
}

function Discover(){
  const [search, setSearch] = useState('')
  const [focusFilter, setFocusFilter] = useState('')
  const [verifiedOnly, setVerifiedOnly] = useState(false)

  const allTags = useMemo(() => {
    const tags = new Set(); NGO_LIST.forEach(n => n.focusAreas.forEach(t => tags.add(t))); return Array.from(tags)
  }, [])

  const filtered = useMemo(() => NGO_LIST.filter(n => {
    const matchesSearch = `${n.name} ${n.location} ${n.tagline}`.toLowerCase().includes(search.toLowerCase())
    const matchesTag = focusFilter ? n.focusAreas.includes(focusFilter) : true
    const matchesVerified = verifiedOnly ? n.verified : true
    return matchesSearch && matchesTag && matchesVerified
  }), [search, focusFilter, verifiedOnly])

  const getCategoryIcon = (focusAreas) => {
    if (focusAreas.includes('Healthcare')) return '🏥'
    if (focusAreas.includes('Education')) return '📚'
    if (focusAreas.includes('Environment')) return '🌿'
    if (focusAreas.includes('Women Empowerment')) return '♀️'
    return '🤝'
  }
  const getNgoImage = (focusAreas) => {
    if (focusAreas.includes('Healthcare')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Education')) return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Environment')) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Women Empowerment')) return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Rural Development')) return 'https://images.unsplash.com/photo-1493815793585-9ab7478361d5?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Animal Welfare')) return 'https://images.unsplash.com/photo-1516738901171-8eb4fc13bd20?q=80&w=1600&auto=format&fit=crop'
    return 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=1600&auto=format&fit=crop'
  }

  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <Breadcrumb items={[{ label: 'Discover NGOs' }]} />
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <motion.div initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{duration:.5}} className="lg:col-span-1 card-base p-6" style={{borderColor:'var(--border-color)'}}>
          <div className="flex items-center gap-2 mb-4"><span className="text-lg">🔍</span><div className="font-semibold" style={{color:'var(--text-primary-color)'}}>Filters</div></div>
          <div className="space-y-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{color:'var(--text-secondary-color)'}}><span>🔍</span> Search</label>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by name, location, or tagline" className="w-full rounded-lg border px-3 py-2" style={{borderColor:'var(--border-color)'}} />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2" style={{color:'var(--text-secondary-color)'}}><span>🎯</span> Focus Area</label>
              <select value={focusFilter} onChange={e=>setFocusFilter(e.target.value)} className="w-full rounded-lg border px-3 py-2 bg-white" style={{borderColor:'var(--border-color)'}}>
                <option value="">All Focus Areas</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-2 select-none"><input type="checkbox" checked={verifiedOnly} onChange={e=>setVerifiedOnly(e.target.checked)} className="rounded" /><span className="text-sm" style={{color:'var(--text-secondary-color)'}}>✅ Verified only</span></label>
            </div>
            <button onClick={()=>{setSearch('');setFocusFilter('');setVerifiedOnly(false)}} className="btn-primary-g w-full rounded-lg px-4 py-2 text-sm font-medium">Clear All Filters</button>
          </div>
        </motion.div>
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="page-title"><span className="brand-gradient">Discover</span> NGOs</h1>
              <p className="page-subtext">Find authentic NGOs making real impact</p>
            </div>
            <div className="text-sm" style={{color:'var(--text-secondary-color)'}}>{filtered.length} NGO{filtered.length!==1?'s':''} found</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((ngo, index) => (
              <motion.div key={ngo.id} initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{duration:.5, delay:index*0.1}} className="card-base overflow-hidden group hover:scale-105 transition-all duration-300 min-h-[520px] flex flex-col">
                <div className="relative w-full overflow-hidden">
                  <img src={getNgoImage(ngo.focusAreas)} alt={`${ngo.focusAreas[0]} NGO`} className="w-full h-48 object-cover rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 rounded-xl" style={{background:'linear-gradient(to top, var(--primary-color), transparent)', opacity:0.25}} />
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getCategoryIcon(ngo.focusAreas)}</span>
                      <div>
                        <div className="card-title">{ngo.name}</div>
                        <div className="page-subtext">Location: {ngo.location}</div>
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${ngo.verified?'bg-green-100 text-green-700':'bg-gray-200 text-gray-700'}`}>{ngo.verified?'✅ Verified':'⚠️ Unverified'}</span>
                  </div>
                  <p className="card-text mb-4">{ngo.tagline}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {ngo.focusAreas.map(tag => <span key={tag} className="text-xs px-2 py-1 rounded-md font-medium bg-gray-100 text-gray-700">{tag}</span>)}
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="text-xs" style={{color:'var(--text-secondary-color)'}}>Impact Score: 4.5⭐</div>
                    <Link to={`/dashboard/ngo/${ngo.id}`} className="btn-primary-g px-4 py-2 rounded-lg text-sm font-medium no-underline">View Profile</Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function NgoProfile(){
  const { ngoId } = useParams()
  const [tab, setTab] = useState('about')
  const [showToast, setShowToast] = useState(false)
  const ngo = useMemo(()=> NGO_LIST.find(n => n.id===ngoId), [ngoId])

  const getNgoImage = (focusAreas) => {
    if (!focusAreas) return 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Healthcare')) return 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Education')) return 'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Environment')) return 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=1600&auto=format&fit=crop'
    if (focusAreas.includes('Women Empowerment')) return 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1600&auto=format&fit=crop'
    return 'https://images.unsplash.com/photo-1455849318743-b2233052fcff?q=80&w=1600&auto=format&fit=crop'
  }

  if (!ngo) return <div className="px-8 pt-8">NGO not found.</div>

  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <div className="rounded-xl overflow-hidden relative" style={{height:200}}>
        <img src={getNgoImage(ngo.focusAreas)} alt="hero" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{background:'linear-gradient(to top, var(--primary-color), transparent)', opacity:0.25}} />
        <div className="absolute inset-0 bg-black/25" />
        <div className="absolute left-5 bottom-5 flex items-center gap-4">
          {ngo.logo && <img src={ngo.logo} alt="logo" className="w-16 h-16 rounded-lg object-cover border-4 border-white" />}
          <div>
            <div className="text-white text-2xl font-bold">{ngo.name}</div>
            <div className="text-white/80 text-sm">{ngo.location}</div>
          </div>
        </div>
        <div className="absolute right-5 bottom-5">
          <button onClick={()=>{setShowToast(true); setTimeout(()=>setShowToast(false), 2200)}} className="no-underline btn-primary-g px-4 py-2 rounded-md text-sm">Connect</button>
        </div>
      </div>
      <div className="card-base">
        <div className="border-b border-gray-200 flex">
          {['about','projects'].map(k => (
            <button key={k} onClick={()=>setTab(k)} className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 ${tab===k?'border-emerald-600 text-emerald-700':'border-transparent text-gray-500 hover:text-gray-700'}`}>{k==='about'?'Overview':'Projects'}</button>
          ))}
        </div>
        <div className="p-5">
          {tab==='about' ? (
            <div className="space-y-4">
              <p className="text-gray-700 text-sm leading-6">{ngo.description}</p>
              <div className="text-sm"><div className="text-gray-500">Contact</div><div className="text-gray-800">{ngo.contact.email} • {ngo.contact.phone}</div></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ngo.projects.map(p => (
                <div key={p.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{p.name}</div>
                      <div className="text-xs text-gray-500">Budget: {p.budget}</div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">{p.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {showToast && (
        <div className="fixed right-4 bottom-6 z-50"><div className="btn-primary-g px-4 py-3 rounded-lg shadow-lg text-white text-sm" style={{boxShadow:'0 8px 25px rgba(0,0,0,0.15)'}}>Connection Request Sent</div></div>
      )}
    </div>
  )
}

function Requests(){
  const DATA=[
    { id:1, ngo:'Seva Foundation', logo:'/images/logo2.jpg', date:'2025-01-10', status:'Pending', focusAreas:['Healthcare','Women Empowerment'], amount:'₹ 15,00,000', description:'Mobile Health Clinics for Rural Areas' },
    { id:2, ngo:'Shiksha Trust', logo:'/images/logo3.jpg', date:'2025-01-07', status:'Accepted', focusAreas:['Education','Digital Literacy'], amount:'₹ 25,00,000', description:'Smart Classroom Program' },
    { id:3, ngo:'Prakriti Collective', logo:'/images/logo.jpg', date:'2025-01-05', status:'Declined', focusAreas:['Environment','Water'], amount:'₹ 8,00,000', description:'Stepwell Restoration Project' },
  ]
  const [activeTab, setActiveTab] = useState('All')
  const tabs = ['All', 'Pending', 'Accepted', 'Declined']
  const filtered = activeTab==='All'? DATA : DATA.filter(d=>d.status===activeTab)
  const getTimeAgo = (d)=> '2 days ago'
  const getStatusColor = (s)=> s==='Pending'?'bg-yellow-100 text-yellow-800 border-yellow-200': s==='Accepted'?'bg-green-100 text-green-700 border-green-200':'bg-red-100 text-red-700 border-red-200'
  const getStatusIcon = (s)=> s==='Pending'?'⏳': s==='Accepted'?'✅':'❌'
  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <Breadcrumb items={[{ label: 'My Requests' }]} />
      <div className="card-base">
        <div className="border-b border-gray-200">
          <div className="flex gap-1 px-6 pt-4">
            {tabs.map(tab => (
              <button key={tab} onClick={()=>setActiveTab(tab)} className={`px-4 py-3 text-sm font-medium transition-all relative ${activeTab===tab?'text-white':'text-gray-500 hover:text-gray-700'}`} style={{background: activeTab===tab? 'linear-gradient(135deg,var(--primary-color),var(--secondary-color))':'transparent'}}>
                <span className="relative z-10">{tab}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map(item => (
              <div key={item.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img src={item.logo} alt={item.ngo} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <div className="font-semibold" style={{color:'var(--text-primary-color)'}}>{item.ngo}</div>
                      <div className="text-sm" style={{color:'var(--text-secondary-color)'}}>{item.description}</div>
                    </div>
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium border ${getStatusColor(item.status)}`}>{getStatusIcon(item.status)} {item.status}</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  {item.focusAreas.map(a=> <span key={a} className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700">{a}</span>)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div style={{color:'var(--text-secondary-color)'}}>Requested {getTimeAgo(item.date)}</div>
                  <div className="font-medium" style={{color:'var(--text-primary-color)'}}>{item.amount}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Reports(){
  const TABLE=[{ ngo:'Seva Foundation', projects:5, funds:85 },{ ngo:'Shiksha Trust', projects:7, funds:120 },{ ngo:'Prakriti Collective', projects:3, funds:40 }]
  const MONTHLY=[{ month:'Jan', funds:18 },{ month:'Feb', funds:22 },{ month:'Mar', funds:15 },{ month:'Apr', funds:28 },{ month:'May', funds:24 },{ month:'Jun', funds:30 }]
  const totalFunds=TABLE.reduce((a,b)=>a+b.funds,0)
  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <Breadcrumb items={[{ label: 'Reports & Analytics' }]} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card-base p-5"><div className="font-semibold mb-3" style={{color:'var(--text-primary-color)'}}>Investment by Focus Area</div><div className="w-full h-72"><ResponsiveContainer><PieChart><Pie data={[{name:'Education',value:40},{name:'Healthcare',value:30},{name:'Environment',value:20},{name:'Others',value:10}]} dataKey="value" nameKey="name" outerRadius={100} innerRadius={60}><Cell fill="var(--primary-color)" /><Cell fill="var(--accent-color)" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" /></Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer></div></div>
        <div className="card-base p-5"><div className="font-semibold mb-3" style={{color:'var(--text-primary-color)'}}>Monthly CSR Spending (₹ Lakh)</div><div className="w-full h-72"><ResponsiveContainer><BarChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="funds" fill="var(--primary-color)" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></div></div>
      </div>
      <div className="card-base p-5"><div className="font-semibold mb-3" style={{color:'var(--text-primary-color)'}}>Partnership Growth Over Time</div><div className="w-full h-72"><ResponsiveContainer><LineChart data={MONTHLY}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Line type="monotone" dataKey="funds" stroke="var(--accent-color)" strokeWidth={2} dot={{r:3}} /></LineChart></ResponsiveContainer></div></div>
      <div className="card-base p-4"><table className="w-full text-sm"><thead><tr className="text-left" style={{color:'var(--text-primary-color)'}}><th className="py-2">NGO</th><th>Projects</th><th>Funds (₹ Lakh)</th></tr></thead><tbody>{TABLE.map((r,idx)=> <tr key={r.ngo} className={idx%2?'bg-gray-50':''}><td className="py-2">{r.ngo}</td><td>{r.projects}</td><td>{r.funds}</td></tr>)}</tbody><tfoot><tr><td className="py-2 font-medium">Total</td><td></td><td>{totalFunds}</td></tr></tfoot></table></div>
    </div>
  )
}

function Profile(){
  const [company,setCompany]=useState({name:'Acme Corp', industry:'Manufacturing', location:'Mumbai, Maharashtra', website:'https://acme.example.com', contactPerson:'Rohit Sharma', email:'csr@acme.example.com', phone:'+91 98765 43210', budget:'₹ 1 - 5 Cr', logo:'/images/logo2.jpg'})
  return (
    <div className="space-y-6 px-8 pt-8 pb-10">
      <Breadcrumb items={[{ label:'My Profile' }]} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-base p-6 lg:col-span-1">
          <div className="flex items-start gap-4">
            <img src={company.logo} alt="logo" className="w-24 h-24 rounded-full object-cover border-4" style={{borderColor:'var(--border-color)'}} />
            <div className="flex-1">
              <div className="text-xl font-bold no-overflow" style={{color:'var(--text-primary-color)'}}>{company.name}</div>
              <div className="text-sm" style={{color:'var(--text-secondary-color)'}}>{company.industry}</div>
              <div className="text-sm mt-1" style={{color:'var(--text-secondary-color)'}}>{company.location}</div>
            </div>
            <button className="btn-primary-g px-3 py-2 rounded-md text-sm">Edit Profile</button>
          </div>
        </div>
        <div className="card-base p-6 lg:col-span-2">
          <div className="font-semibold mb-4" style={{color:'var(--text-primary-color)'}}>Company Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {label:'Company Name', value:company.name, onChange:v=>setCompany({...company,name:v})},
              {label:'Website', value:company.website, onChange:v=>setCompany({...company,website:v})},
              {label:'Contact Person', value:company.contactPerson, onChange:v=>setCompany({...company,contactPerson:v})},
              {label:'Email', value:company.email, onChange:v=>setCompany({...company,email:v})},
              {label:'Phone', value:company.phone, onChange:v=>setCompany({...company,phone:v})},
              {label:'CSR Budget', value:company.budget, onChange:v=>setCompany({...company,budget:v})},
            ].map((f,i)=> (
              <label key={i} className="block">
                <span className="text-sm mb-1 block" style={{color:'var(--text-secondary-color)'}}>{f.label}</span>
                <input className="w-full border rounded-lg px-3 py-2" style={{borderColor:'var(--border-color)'}} value={f.value} onChange={e=>f.onChange(e.target.value)} />
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-3 items-center">
            <button className="btn-primary-g px-5 py-2 rounded-md text-sm">Save Changes</button>
            <button className="btn-secondary-o px-5 py-2 rounded-md text-sm">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Routes wrapper ----------
export default function DashboardBundle(){
  return (
    <Routes>
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="discover" element={<Discover />} />
        <Route path="ngo/:ngoId" element={<NgoProfile />} />
        <Route path="requests" element={<Requests />} />
        <Route path="reports" element={<Reports />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  )
}


