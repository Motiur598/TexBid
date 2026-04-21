import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Gavel, 
  Users, 
  BarChart3, 
  Settings, 
  Search, 
  Bell, 
  ChevronDown,
  ArrowUpRight,
  Clock,
  PackageCheck,
  Truck,
  ShieldCheck,
  Building2,
  MapPin,
  RefreshCcw,
  Loader2,
  Menu,
  X,
  CheckCircle2,
  Circle
} from 'lucide-react';

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  BDT: '৳'
};

const NAVIGATION = [
  { name: 'Dashboard', icon: LayoutDashboard, current: true },
  { name: 'Active RFQs', icon: FileText, current: false },
  { name: 'Bids', icon: Gavel, current: false },
  { name: 'Suppliers', icon: Users, current: false },
  { name: 'Analytics', icon: BarChart3, current: false },
  { name: 'Settings', icon: Settings, current: false },
];

export default function App() {
  const [currency, setCurrency] = useState('USD');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // State for Backend Data
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Updated to port 8001 to match the running backend server
        const response = await fetch('http://localhost:8001/api/dashboard/active-order');
        if (!response.ok) throw new Error('Failed to fetch data');
        const data = await response.json();
        setDashboardData(data);
      } catch (err) {
        setError(err.message);
        console.error("Dashboard fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleCurrencyChange = (newCurrency) => {
    if (newCurrency === currency) return;
    setIsTransitioning(true);
    setCurrency(newCurrency);
    setIsCurrencyDropdownOpen(false);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const formatCurrency = (value, targetCurrency) => {
    if (!dashboardData) return "$0";
    const rate = dashboardData.exchange_rates[targetCurrency] || 1;
    const converted = value * rate;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(converted);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-slate-500 font-medium animate-pulse">Initializing TexBid Workspace...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-100 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Lost</h2>
          <p className="text-slate-500 text-sm mb-6">{error || "Could not connect to the TexBid API. Please ensure the backend server is running."}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-500/25"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { order, exchange_rates, supplier } = dashboardData;
  const BASE_CURRENCY = 'USD'; 

  const getStatusIcon = (status) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle2 className="w-5 h-5" />;
      case 'IN_PROGRESS': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'PENDING': return <Circle className="w-5 h-5" />;
      default: return <Circle className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'text-emerald-500 bg-emerald-50 border-emerald-200';
      case 'IN_PROGRESS': return 'text-blue-600 bg-blue-50 border-blue-200 ring-4 ring-blue-50';
      case 'PENDING': return 'text-slate-300 bg-slate-50 border-slate-200';
      default: return 'text-slate-300 bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 text-white font-bold text-2xl tracking-tight">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20 transform rotate-3">
              <span className="text-white text-xl">T</span>
            </div>
            TexBid<span className="text-blue-500 text-3xl leading-none -ml-1">.</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto">
          {NAVIGATION.map((item) => (
            <a
              key={item.name}
              href="#"
              className={`flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-300 group ${
                item.current 
                  ? 'bg-blue-600/15 text-blue-400 shadow-inner' 
                  : 'hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${item.current ? 'text-blue-500' : 'text-slate-500 group-hover:text-blue-400'}`} />
              {item.name}
            </a>
          ))}
        </nav>
        
        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="bg-slate-800/40 rounded-2xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shadow-md">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-white tracking-wide">Verified Buyer</p>
                <p className="text-xs text-slate-500 font-medium">Enterprise Tier</p>
              </div>
            </div>
            <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 w-4/5"></div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 z-30 shadow-sm sticky top-0">
          <div className="flex items-center gap-4 flex-1">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="max-w-md w-full relative group hidden sm:block">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search RFQs, orders, suppliers..."
                className="block w-full pl-12 pr-4 py-3 border border-slate-200 rounded-2xl text-sm placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all bg-slate-50/50 hover:bg-white focus:bg-white shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6 ml-4">
            {/* Global Currency Toggle */}
            <div className="relative">
              <button 
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:border-blue-300 hover:shadow-md text-sm font-bold text-slate-700 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/10"
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-black shadow-inner">
                  {CURRENCY_SYMBOLS[currency]}
                </div>
                <span className="hidden xs:inline">{currency}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isCurrencyDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isCurrencyDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsCurrencyDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-3 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-40 transform origin-top-right transition-all">
                    {Object.keys(exchange_rates).map((curr) => (
                      <button
                        key={curr}
                        onClick={() => handleCurrencyChange(curr)}
                        className={`w-full text-left px-5 py-3 text-sm flex items-center gap-3 hover:bg-blue-50/50 transition-colors ${currency === curr ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600'}`}
                      >
                        <div className={`flex items-center justify-center w-6 h-6 rounded-lg text-xs font-black ${currency === curr ? 'bg-blue-200 text-blue-800 shadow-sm' : 'bg-slate-100 text-slate-500'}`}>
                          {CURRENCY_SYMBOLS[curr]}
                        </div>
                        {curr}
                        {currency === curr && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button className="relative p-2.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all group">
              <Bell className="w-6 h-6 group-hover:shake" />
              <span className="absolute top-2.5 right-2.5 block h-3 w-3 rounded-full bg-rose-500 border-2 border-white ring-2 ring-rose-100 animate-bounce"></span>
            </button>
            
            <div className="h-10 w-px bg-slate-200 hidden xs:block"></div>
            
            <button className="flex items-center gap-3 p-1 pr-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="relative">
                <img
                  className="h-10 w-10 rounded-xl border-2 border-white shadow-md object-cover"
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                  alt="User avatar"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 space-y-10 custom-scrollbar bg-slate-50/50">
          
          <div className="max-w-7xl mx-auto space-y-10">
            
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 bg-blue-500/5 rounded-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-3 text-sm font-bold tracking-widest uppercase text-blue-600/60">
                  <span className="bg-blue-600/10 px-2 py-0.5 rounded text-[10px]">Active Order</span>
                  <span>/</span>
                  <span className="text-slate-400">{order.id}</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                  {order.title}
                </h1>
                <p className="text-slate-500 font-medium flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Produced by <span className="text-slate-900 font-bold">{supplier.name}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 relative z-10">
                <div className="px-5 py-2.5 rounded-2xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-bold text-sm flex items-center gap-2 shadow-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  {order.status}
                </div>
                <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 active:scale-95 flex items-center gap-2">
                  Action Center
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-10">
              
              {/* Left Column (Main Details) - 8 columns wide on XL */}
              <div className="xl:col-span-8 space-y-8 lg:space-y-10">
                
                {/* Core Feature 2: Milestone Tracking Timeline Card */}
                <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-lg shadow-slate-200/50 border border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                        Order Progress
                      </h2>
                      <p className="text-slate-400 font-medium mt-1">Live production status and milestone tracking</p>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></div>
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Live Updates</span>
                    </div>
                  </div>

                  {/* Responsive Timeline Container */}
                  <div className="relative">
                    {/* Desktop Horizontal View */}
                    <div className="hidden lg:flex justify-between items-start relative px-4">
                      {/* Connecting Line Background */}
                      <div className="absolute top-6 left-10 right-10 h-1 bg-slate-100 rounded-full z-0"></div>
                      
                      {order.milestones_timeline.map((milestone, idx) => {
                        const isCompleted = milestone.status === 'COMPLETED';
                        const isInProgress = milestone.status === 'IN_PROGRESS';
                        const isPending = milestone.status === 'PENDING';

                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center group w-1/6">
                            {/* Circle Node */}
                            <div className={`
                              w-12 h-12 rounded-2xl border-4 border-white flex items-center justify-center transition-all duration-500 shadow-xl
                              ${getStatusColor(milestone.status)}
                              ${isInProgress ? 'scale-125' : 'hover:scale-110'}
                            `}>
                              {getStatusIcon(milestone.status)}
                            </div>
                            
                            {/* Label */}
                            <div className="mt-6 text-center">
                              <p className={`text-xs font-black uppercase tracking-wider mb-1 transition-colors duration-300 ${isPending ? 'text-slate-300' : 'text-slate-900'}`}>
                                {milestone.name}
                              </p>
                              {isCompleted && (
                                <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shadow-sm">
                                  {milestone.timestamp}
                                </p>
                              )}
                              {isInProgress && (
                                <p className="text-[10px] font-bold text-blue-600 animate-pulse bg-blue-50 px-2 py-0.5 rounded">
                                  Current Stage
                                </p>
                              )}
                            </div>

                            {/* Active Line Progress */}
                            {idx < order.milestones_timeline.length - 1 && isCompleted && (
                              <div className="absolute top-6 left-1/2 w-full h-1 bg-emerald-500 z-[-1]"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Mobile/Tablet Vertical View */}
                    <div className="lg:hidden space-y-10 pl-6 relative">
                      {/* Vertical line */}
                      <div className="absolute top-2 left-[2.4rem] bottom-2 w-1 bg-slate-100 rounded-full"></div>
                      
                      {order.milestones_timeline.map((milestone, idx) => {
                        const isCompleted = milestone.status === 'COMPLETED';
                        const isInProgress = milestone.status === 'IN_PROGRESS';
                        const isPending = milestone.status === 'PENDING';

                        return (
                          <div key={idx} className="flex gap-8 relative">
                            {/* Progress Fill Line */}
                            {idx < order.milestones_timeline.length - 1 && isCompleted && (
                              <div className="absolute top-10 left-[0.4rem] w-1 h-full bg-emerald-500 z-0 translate-x-[0.125rem]"></div>
                            )}
                            
                            {/* Node */}
                            <div className={`
                              relative z-10 w-12 h-12 rounded-2xl border-4 border-white flex-shrink-0 flex items-center justify-center shadow-xl transition-all duration-500
                              ${getStatusColor(milestone.status)}
                              ${isInProgress ? 'scale-110' : ''}
                            `}>
                              {getStatusIcon(milestone.status)}
                            </div>
                            
                            {/* Content */}
                            <div className="pt-1.5">
                              <h4 className={`text-sm font-black uppercase tracking-widest ${isPending ? 'text-slate-300' : 'text-slate-900'}`}>
                                {milestone.name}
                              </h4>
                              {isCompleted && (
                                <p className="text-xs font-bold text-emerald-600 mt-1.5 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {milestone.timestamp}
                                </p>
                              )}
                              {isInProgress && (
                                <div className="mt-3 bg-blue-600 text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-blue-500/30 flex items-center gap-2 w-max">
                                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                                  In Progress
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Financial Summary Card */}
                <div className="bg-slate-900 rounded-[2rem] p-8 sm:p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-32 -mt-32 transition-all duration-700 group-hover:bg-blue-600/20"></div>
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -ml-24 -mb-24"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
                    <div>
                      <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        Financial Summary
                      </h2>
                      <p className="text-slate-400 font-medium mt-1">Transaction value and settlement milestones</p>
                    </div>
                    
                    <div className="inline-flex bg-slate-800 p-1.5 rounded-2xl border border-slate-700 shadow-inner">
                      {['USD', 'EUR', 'BDT'].map((curr) => (
                        <button
                          key={curr}
                          onClick={() => handleCurrencyChange(curr)}
                          className={`px-5 py-2 text-xs font-black rounded-xl transition-all duration-300 ${
                            currency === curr 
                              ? 'bg-blue-600 text-white shadow-lg' 
                              : 'text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">
                    <div className="lg:col-span-7 bg-slate-800/50 rounded-3xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-inner group">
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-4">Total Contract Value</p>
                      
                      <div className="relative">
                        <div className={`transition-all duration-500 ease-out transform ${isTransitioning ? 'opacity-0 -translate-y-4 blur-sm' : 'opacity-100 translate-y-0 blur-0'}`}>
                          <div className="flex items-baseline gap-3 flex-wrap">
                            <span className="text-5xl sm:text-6xl font-black tracking-tighter text-white">
                              {formatCurrency(order.base_value_usd, currency)}
                            </span>
                            <span className="text-2xl font-bold text-slate-500">{currency}</span>
                          </div>
                          
                          <div className="mt-6 flex items-center gap-3 text-sm font-bold text-slate-400 bg-slate-900/50 w-max px-4 py-2 rounded-xl border border-slate-800/50 group-hover:border-blue-500/30 transition-colors">
                            <RefreshCcw className={`w-4 h-4 text-blue-500 ${isTransitioning ? 'animate-spin' : ''}`} />
                            <span>≈ {formatCurrency(order.base_value_usd, BASE_CURRENCY)} {BASE_CURRENCY}</span>
                            <span className="text-slate-600 font-medium">(Base)</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="lg:col-span-5 space-y-6">
                      {[
                        { label: 'Advance Payment', pct: '30%', val: order.milestones.advance, color: 'bg-blue-500' },
                        { label: 'Upon Shipment', pct: '50%', val: order.milestones.shipment, color: 'bg-slate-600' },
                        { label: 'Final Delivery', pct: '20%', val: order.milestones.delivery, color: 'bg-slate-600' }
                      ].map((m, i) => (
                        <div key={i} className="flex justify-between items-end p-4 rounded-2xl bg-slate-800/30 border border-slate-800 hover:border-slate-700 transition-colors group/m">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{m.label} ({m.pct})</span>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${m.color} shadow-[0_0_8px_rgba(59,130,246,0.5)]`}></div>
                              <span className={`font-black text-lg transition-all duration-300 text-white ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                                {formatCurrency(m.val, currency)}
                              </span>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-slate-700 group-hover/m:text-blue-500 transition-colors cursor-pointer" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column (Supplier Details & Stats) - 4 columns wide on XL */}
              <div className="xl:col-span-4 space-y-8 lg:space-y-10">
                
                {/* Supplier Profile Card */}
                <div className="bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/40 border border-slate-100 group">
                  <h2 className="text-xl font-black text-slate-900 mb-8">Supplier Profile</h2>
                  
                  <div className="flex items-center gap-5 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center border-4 border-indigo-50 shadow-xl transform -rotate-3 transition-transform group-hover:rotate-0">
                      <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-900 tracking-tight">{supplier.name}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500 font-bold">
                        <MapPin className="w-4 h-4 text-rose-500" />
                        {supplier.location}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-slate-50 pt-8">
                    {[
                      { label: 'Platform Rating', val: supplier.rating, icon: '★', iconColor: 'text-amber-400', bold: true },
                      { label: 'On-Time Delivery', val: supplier.on_time_delivery, icon: <PackageCheck className="w-4 h-4" />, iconColor: 'text-blue-500' },
                      { label: 'Response Rate', val: supplier.response_rate, icon: <Clock className="w-4 h-4" />, iconColor: 'text-emerald-500', success: true },
                    ].map((s, i) => (
                      <div key={i} className="flex justify-between items-center p-3 rounded-xl hover:bg-slate-50 transition-colors">
                        <span className="text-sm font-bold text-slate-400">{s.label}</span>
                        <div className={`flex items-center gap-1.5 font-black text-sm ${s.success ? 'text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg' : 'text-slate-900'}`}>
                          <span className={s.iconColor}>{s.icon}</span>
                          {s.val}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <button className="w-full mt-8 py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-sm font-black uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-3 group">
                    Secure Messaging
                    <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                  </button>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-100 flex flex-col justify-between hover:shadow-2xl transition-shadow relative overflow-hidden group">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-6 shadow-inner">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-4xl font-black text-slate-900 tracking-tighter">{order.timeline.days_to_deadline}</p>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Days to Deadline</p>
                    </div>
                  </div>
                  <div className="bg-emerald-500 p-8 rounded-[2rem] shadow-lg shadow-emerald-500/20 flex flex-col justify-between hover:scale-[1.02] transition-transform relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 bg-white/10 rounded-full -mr-8 -mt-8"></div>
                    <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                      <PackageCheck className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-4xl font-black text-white tracking-tighter">
                        {new Intl.NumberFormat('en-US', { notation: "compact" , compactDisplay: "short" }).format(order.timeline.units_ordered)}
                      </p>
                      <p className="text-xs font-bold text-white/70 uppercase tracking-widest mt-2">Units in Production</p>
                    </div>
                  </div>
                </div>

              </div>
              
            </div>
          </div>
        </main>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
        
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-10deg); }
          75% { transform: rotate(10deg); }
        }
        .group:hover .shake { animation: shake 0.5s ease-in-out; }
        
        @media (max-width: 480px) {
          .xs\\:inline { display: none; }
          .xs\\:block { display: none; }
        }
      `}} />
    </div>
  );
}
