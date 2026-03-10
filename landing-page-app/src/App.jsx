import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Monitor, 
  Smartphone, 
  Users, 
  Zap, 
  BarChart3, 
  MessageSquare, 
  Menu, 
  X, 
  Download, 
  ChevronRight, 
  Globe,
  MonitorPlay,
  Terminal,
  CheckCircle as CheckIcon,
  Layers,
  ShieldCheck,
  Rocket
} from 'lucide-react';

// Animation Wrapper Component
const RevealOnScroll = ({ children, delay = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

export default function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    classIcons: [],
    avatars: []
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Fetch stats from public API
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/public/stats');
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats', err);
      }
    };
    fetchStats();
  }, []);

  // ฟังก์ชันสำหรับเลื่อนหน้าจออย่างสมูท
  const scrollToSection = (e, sectionId) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      // ชดเชยความสูงของ Navbar ที่ fix ไว้ด้านบน (ประมาณ 80-100px)
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    // ปิดเมนูบนมือถือ (ถ้าเปิดอยู่)
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 selection:bg-[#00D06C] selection:text-black" style={{ fontFamily: "'Inter', 'IBM Plex Sans Thai', sans-serif" }}>
      {/* Global Styles for Fonts and Custom Animations */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@300;400;500;600;700&family=Inter:wght@400;600;700;800&display=swap');
          
          html, body {
            font-family: 'Inter', 'IBM Plex Sans Thai', sans-serif;
            scroll-behavior: smooth;
          }
          
          h1, h2, h3, h4 {
            letter-spacing: -0.02em;
          }
          
          p {
            line-height: 1.8;
          }
          
          .glass-card {
            background: rgba(18, 18, 20, 0.7);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(39, 39, 42, 0.8);
          }

          /* Floating Animation */
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }
          .animate-float {
            animation: float 4s ease-in-out infinite;
          }
        `}
      </style>

      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 border-b ${
        scrolled ? 'bg-[#09090b]/90 backdrop-blur-md border-zinc-800 py-3' : 'bg-transparent border-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer group">
            <div className="relative flex items-center justify-center w-10 h-10 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-[#00D06C] transition-colors">
              <MonitorPlay className="w-6 h-6 text-[#00D06C]" />
              <div className="absolute inset-0 bg-[#00D06C] blur-md opacity-0 group-hover:opacity-20 transition-opacity rounded-lg"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-sans">
              E-<span className="text-[#00D06C]">Chair</span>
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-[#00D06C] transition-colors">เกี่ยวกับเรา</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="hover:text-[#00D06C] transition-colors">ฟีเจอร์</a>
            <a href="#download" onClick={(e) => scrollToSection(e, 'download')} className="hover:text-[#00D06C] transition-colors">ดาวน์โหลด</a>
            
            <div className="flex items-center gap-4 ml-4">
              <button 
                onClick={() => window.location.href='/app/login'}
                className="text-zinc-300 hover:text-white transition-colors font-medium">
                เข้าสู่ระบบ
              </button>
              <button 
                onClick={() => window.location.href='/app/login'}
                className="px-6 py-2.5 bg-[#00D06C] hover:bg-[#00E676] text-black font-semibold rounded-full transition-all transform hover:-translate-y-0.5 shadow-[0_4px_15px_rgba(0,208,108,0.3)] flex items-center gap-2">
                <Globe className="w-4 h-4" />
                เปิด Web App
              </button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden text-zinc-400 hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-[#09090b] border-b border-zinc-800 py-4 px-6 flex flex-col gap-4 shadow-xl">
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="text-zinc-300 hover:text-[#00D06C] py-2">เกี่ยวกับเรา</a>
            <a href="#features" onClick={(e) => scrollToSection(e, 'features')} className="text-zinc-300 hover:text-[#00D06C] py-2">ฟีเจอร์</a>
            <a href="#download" onClick={(e) => scrollToSection(e, 'download')} className="text-zinc-300 hover:text-[#00D06C] py-2">ดาวน์โหลด</a>
            <hr className="border-zinc-800" />
            <button 
               onClick={() => window.location.href='/app/login'}
               className="w-full text-left text-zinc-300 hover:text-white py-2">เข้าสู่ระบบ</button>
            <button 
               onClick={() => window.location.href='/app/login'}
               className="w-full px-5 py-3 bg-[#00D06C] text-black font-semibold rounded-full flex items-center justify-center gap-2">
              <Globe className="w-5 h-5" />
              เปิด Web App
            </button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00D06C] rounded-full blur-[150px] opacity-15 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <RevealOnScroll>
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-medium text-zinc-300 mb-6">
                  <span className="w-2 h-2 rounded-full bg-[#00D06C] animate-pulse"></span>
                  E-Chair Version 1.0 พร้อมใช้งานแล้ว!
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold text-white leading-[1.15] tracking-tight mb-6">
                  ยกระดับห้องเรียนสู่ <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00D06C] to-[#00A855]">
                    Interactive Experience
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-zinc-400 mb-8 leading-relaxed font-light">
                  แอปพลิเคชันจัดการคลาสเรียนยุคใหม่ สร้างการมีส่วนร่วม ตอบคำถาม และเช็คชื่อแบบเรียลไทม์ ใช้งานลื่นไหลทั้งบนเว็บและมือถือ
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => window.location.href='/app/login'}
                    className="px-8 py-4 bg-[#00D06C] hover:bg-[#00E676] text-black font-bold rounded-full transition-all duration-300 transform hover:-translate-y-1 shadow-[0_8px_25px_rgba(0,208,108,0.3)] flex items-center justify-center gap-2 text-lg">
                    <Globe className="w-5 h-5" />
                    เริ่มต้นใช้งาน Web App
                  </button>
                  <a href="#download" className="px-8 py-4 bg-zinc-900/80 hover:bg-zinc-800 backdrop-blur-sm border border-zinc-700 hover:border-[#00D06C]/50 text-white font-semibold rounded-full transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 text-lg group">
                    <Download className="w-5 h-5 text-zinc-400 group-hover:text-[#00D06C] transition-colors" />
                    ดาวน์โหลดแอป
                  </a>
                </div>
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={200}>
              <div className="relative hidden lg:block animate-float">
                <div className="relative rounded-2xl border border-zinc-800/80 bg-[#121214]/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden transform transition-transform duration-700">
                  <div className="h-12 bg-zinc-900/80 border-b border-zinc-800 flex items-center px-4 gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/80"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3.5 h-3.5 rounded-full bg-green-500/80"></div>
                    <div className="ml-4 text-[10px] text-zinc-500 font-mono tracking-widest uppercase flex items-center gap-2 bg-zinc-800/50 px-3 py-1.5 rounded-full">
                      <MonitorPlay className="w-3 h-3 text-[#00D06C]" /> e-chair-dashboard
                    </div>
                  </div>
                  <div className="p-6 grid grid-cols-3 gap-6 h-[400px]">
                    <div className="col-span-1 space-y-4">
                      <div className="h-10 rounded-xl bg-zinc-800 w-full animate-pulse"></div>
                      <div className="h-4 rounded-full bg-zinc-800/50 w-5/6"></div>
                      <div className="h-4 rounded-full bg-zinc-800/50 w-4/6"></div>
                      <div className="mt-8 bg-gradient-to-br from-zinc-800/50 to-zinc-900 border border-zinc-700/50 rounded-2xl p-5 shadow-inner">
                        <div className="text-[10px] text-zinc-500 mb-2 font-bold tracking-widest uppercase">Total Users</div>
                        <div className="text-4xl font-bold text-[#00D06C]">{stats.totalUsers > 0 ? stats.totalUsers : 42}</div>
                      </div>
                    </div>
                    <div className="col-span-2 space-y-5">
                      <div className="h-32 rounded-2xl border border-[#00D06C]/30 bg-gradient-to-br from-[#00D06C]/10 to-transparent flex items-center justify-center relative overflow-hidden text-center p-4">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-[#00D06C]"></div>
                        <div>
                          <div className="text-[#00D06C] font-semibold mb-2 flex items-center justify-center gap-2 text-lg">
                            <Zap className="w-5 h-5 fill-[#00D06C]" /> Live Polling Active
                          </div>
                          <div className="text-zinc-500 text-[11px] font-medium tracking-wide">Waiting for responses...</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-5">
                        <div className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/50"></div>
                        <div className="h-28 rounded-2xl border border-zinc-800 bg-zinc-900/50"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 bg-[#09090b] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Visual Part */}
            <div className="order-2 lg:order-1 relative">
              <RevealOnScroll delay={100}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-4 pt-12">
                    <div className="glass-card p-6 rounded-3xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default group">
                      <ShieldCheck className="w-10 h-10 text-[#00D06C] mb-4 group-hover:scale-110 transition-transform" />
                      <h4 className="text-white font-bold mb-2">เสถียรและปลอดภัย</h4>
                      <p className="text-zinc-500 text-xs">ระบบ Cloud ที่รองรับผู้ใช้งานพร้อมกันจำนวนมากโดยไม่กระตุก</p>
                    </div>
                    <div className="glass-card p-6 rounded-3xl border-[#00D06C]/20 bg-[#00D06C]/5 transform rotate-2">
                      <Layers className="w-10 h-10 text-[#00D06C] mb-4" />
                      <h4 className="text-white font-bold mb-2">เชื่อมต่อทุกช่องทาง</h4>
                      <p className="text-zinc-500 text-xs">ข้อมูลซิงค์กันแบบเรียลไทม์ระหว่างมือถือและคอมพิวเตอร์</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="aspect-square bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-3xl border border-zinc-700 flex items-center justify-center p-8 group overflow-hidden relative">
                      <div className="absolute inset-0 bg-[#00D06C]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <Rocket className="w-20 h-20 text-[#00D06C] transform group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-700" />
                    </div>
                    <div className="glass-card p-6 rounded-3xl transform -rotate-2">
                      <div className="flex -space-x-3 mb-4">
                        {(stats.classIcons || []).length > 0 ? (stats.classIcons || []).map((icon, i) => (
                           <div key={i} className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold text-white shadow-sm" style={{ backgroundColor: icon.color }}>
                             {icon.initials}
                           </div>
                        )) : [1,2,3,4].map(i => (
                          <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-zinc-800 flex items-center justify-center text-[10px] font-bold">C{i}</div>
                        ))}
                        {stats.totalClasses > 4 && (
                           <div className="w-8 h-8 rounded-full border-2 border-black bg-[#00D06C] text-black flex items-center justify-center text-[10px] font-bold">
                             +{stats.totalClasses - (stats.classIcons || []).length}
                           </div>
                        )}
                      </div>
                      <h4 className="text-white font-bold mb-1 text-sm">ใช้งานแล้วกว่า {stats.totalClasses > 0 ? stats.totalClasses : 100}+ คลาส</h4>
                      <p className="text-[#00D06C] text-[10px] font-bold tracking-widest uppercase">Trusted by Educators</p>
                    </div>
                  </div>
                </div>
              </RevealOnScroll>
            </div>

            {/* Text Part */}
            <div className="order-1 lg:order-2">
              <RevealOnScroll>
                <h2 className="text-xs font-bold text-[#00D06C] tracking-[0.2em] uppercase mb-4 flex items-center gap-2">
                  <span className="w-8 h-[1px] bg-[#00D06C]"></span> ทำความรู้จัก E-CHAIR
                </h2>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                  เปลี่ยนการเรียนแบบเดิม <br/> ให้กลายเป็นเรื่องสนุก
                </h3>
                <p className="text-zinc-400 mb-6 font-light">
                  E-Chair เกิดจากแนวคิดที่ต้องการทำลายกำแพงระหว่าง "ผู้สอน" และ "ผู้เรียน" ในห้องเรียนขนาดใหญ่ เราพบว่านักเรียนส่วนใหญ่มักจะไม่กล้าแสดงออกหรือมีส่วนร่วม 
                </p>
                <p className="text-zinc-400 mb-8 font-light">
                  ระบบของเราจึงถูกพัฒนาขึ้นเพื่อให้ทุกคนมีตัวตนในคลาสเรียน ผ่านระบบ Interactive ที่ใช้งานง่ายเพียงปลายนิ้วสัมผัส ไม่ว่าจะเป็นการโหวต การตอบคำถาม หรือการส่งข้อความหาอาจารย์โดยตรง
                </p>
                
                <ul className="space-y-4 mb-10">
                  {[
                    "รองรับการเช็คชื่อที่รวดเร็ว",
                    "ระบบสุ่มชื่อผู้โชคดีเพื่อตอบคำถาม",
                    "พื้นที่แลกเปลี่ยนความคิดเห็นแบบนิรนาม"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 group">
                      <div className="mt-1.5 w-5 h-5 rounded-full bg-[#00D06C]/10 border border-[#00D06C]/30 flex items-center justify-center shrink-0 group-hover:bg-[#00D06C] transition-colors duration-300">
                        <CheckIcon className="w-3 h-3 text-[#00D06C] group-hover:text-black" />
                      </div>
                      <span className="text-zinc-300 text-sm font-medium">{item}</span>
                    </li>
                  ))}
                </ul>

                <button className="flex items-center gap-2 text-[#00D06C] font-bold hover:gap-4 transition-all group">
                  อ่านเรื่องราวของเราเพิ่มเติม <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
              </RevealOnScroll>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-[#0c0c0e] border-y border-zinc-900">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-xs font-bold text-[#00D06C] tracking-[0.2em] uppercase mb-4">Core Features</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-white">เครื่องมือครบจบในที่เดียว</h3>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <RevealOnScroll delay={100}>
              <FeatureCard 
                icon={<Users className="w-7 h-7 text-[#00D06C]" />}
                title="จัดการคลาสเรียนง่ายดาย"
                desc="สร้างห้องเรียน เชิญนักเรียนด้วยรหัสหรือ QR Code พร้อมระบบเช็คชื่ออัตโนมัติ"
              />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <FeatureCard 
                icon={<Zap className="w-7 h-7 text-[#00D06C]" />}
                title="Live Polling & Quiz"
                desc="สร้างคำถามทดสอบความเข้าใจระหว่างเรียน แสดงผลลัพธ์เป็นกราฟทันที"
              />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <FeatureCard 
                icon={<BarChart3 className="w-7 h-7 text-[#00D06C]" />}
                title="Analytics & Reports"
                desc="สรุปสถิติการเข้าเรียนและการมีส่วนร่วม ส่งออกข้อมูลเป็นไฟล์ CSV ได้สะดวก"
              />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Download Section */}
      <section id="download" className="py-24 relative overflow-hidden bg-[#09090b]">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
          <RevealOnScroll>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">ดาวน์โหลดและเข้าใช้งาน</h2>
              <p className="text-zinc-400 font-light">เลือกแพลตฟอร์มที่คุณต้องการ เพื่อเริ่มต้นประสบการณ์การเรียนรู้ที่เหนือกว่า</p>
            </div>
          </RevealOnScroll>
          <div className="grid md:grid-cols-3 gap-6">
            <RevealOnScroll delay={100}>
              <DownloadCard 
                icon={<Globe className="w-8 h-8 text-[#00D06C]" />}
                title="Web Application"
                subtitle="No install required"
                action={<button 
                  onClick={() => window.location.href='/app/login'}
                  className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-2xl transition-all shadow-lg">เปิดเว็บแอป</button>}
              />
            </RevealOnScroll>
            <RevealOnScroll delay={200}>
              <DownloadCard 
                icon={<Monitor className="w-8 h-8 text-[#00D06C]" />}
                title="Desktop App"
                subtitle="Windows & macOS"
                action={
                  <div className="w-full flex gap-3">
                    <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 hover:text-[#00D06C] text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"><WindowsIcon className="w-4 h-4" /> Win</button>
                    <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 hover:text-[#00D06C] text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"><AppleIcon className="w-4 h-4 pb-0.5" /> Mac</button>
                  </div>
                }
              />
            </RevealOnScroll>
            <RevealOnScroll delay={300}>
              <DownloadCard 
                icon={<Smartphone className="w-8 h-8 text-[#00D06C]" />}
                title="Mobile App"
                subtitle="iOS & Android"
                action={
                  <div className="w-full flex gap-3">
                    <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 hover:text-[#00D06C] text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"><AppleIcon className="w-4 h-4 pb-0.5" /> iOS</button>
                    <button className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 hover:text-[#00D06C] text-white font-bold rounded-2xl transition-all text-sm flex items-center justify-center gap-2"><PlayStoreIcon className="w-4 h-4" /> Android</button>
                  </div>
                }
              />
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* Avatar Marquee Section */}
      <section className="py-12 bg-[#09090b] border-t border-zinc-900 overflow-hidden relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#09090b] to-transparent z-10 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#09090b] to-transparent z-10 pointer-events-none"></div>
        
        <div className="text-center mb-6 relative z-20">
             <p className="text-zinc-500 text-sm font-medium tracking-wide">เข้าร่วมกับผู้ใช้งานกว่า <span className="text-[#00D06C] font-bold">{stats.totalUsers}+</span> คน</p>
        </div>

        <div className="flex animate-scroll hover:animation-play-state-paused overflow-hidden py-4" style={{ width: 'max-content' }}>
             {/* Repeat the list many times to ensure a truly infinite feel without gaps */}
             {[...(stats.avatars || []), ...(stats.avatars || []), ...(stats.avatars || []), ...(stats.avatars || []), ...(stats.avatars || []), ...(stats.avatars || [])].map((avatar, i) => {
                let url = avatar?.url || (typeof avatar === 'string' ? avatar : '');
                if (url && url.startsWith('/')) {
                    url = `${url}`;
                }
                const seed = i % 10;                
                return (
                  <div key={i} className="flex-shrink-0 mx-3 md:mx-4 transition-transform hover:scale-110 duration-300">
                      <div className="relative group/item">
                        <img 
                            src={url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`} 
                            alt="User" 
                            className="w-14 h-14 md:w-20 md:h-20 rounded-full border-2 border-zinc-800 object-cover opacity-60 group-hover/item:opacity-100 group-hover/item:border-[#00D06C] transition-all bg-zinc-900 shadow-xl" 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=fallback${seed}`;
                            }}
                        />
                        <div className="absolute inset-0 rounded-full bg-[#00D06C]/10 opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
                      </div>
                  </div>
                );
             })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-[#060608] py-16">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-3">
            <div className="flex items-center gap-2">
              <MonitorPlay className="w-6 h-6 text-[#00D06C]" />
              <span className="text-2xl font-bold text-white">E-<span className="text-[#00D06C]">Chair</span></span>
            </div>
            <div className="text-xs font-medium text-zinc-500 flex items-center gap-1.5 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800/80">
              <span>by</span>
              <span className="text-zinc-300">FTE Computer Education</span>
              <span className="text-[#00D06C] font-bold">KMUTNB</span>
            </div>
          </div>
          <div className="text-xs text-zinc-600 uppercase tracking-widest text-center md:text-right">
            &copy; 2026 E-Chair Interactive.<br className="md:hidden" /> All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

// Sub-components
function FeatureCard({ icon, title, desc }) {
  return (
    <div className="bg-gradient-to-b from-zinc-900/60 to-[#121214] border border-zinc-800 hover:border-[#00D06C]/40 p-8 rounded-3xl transition-all duration-500 group hover:-translate-y-2 h-full">
      <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:bg-[#00D06C]/10 transition-all">{icon}</div>
      <h4 className="text-xl font-bold text-white mb-3">{title}</h4>
      <p className="text-zinc-400 text-sm font-light">{desc}</p>
    </div>
  );
}

function DownloadCard({ icon, title, subtitle, action }) {
  return (
    <div className="p-8 rounded-[2rem] bg-zinc-900/40 border border-zinc-800 hover:border-[#00D06C]/40 transition-all flex flex-col items-center text-center group h-full">
      <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mb-6 border border-zinc-800 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-xs text-zinc-500 uppercase tracking-widest mb-8">{subtitle}</p>
      {action}
    </div>
  );
}

// Icons
function WindowsIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.949-1.801"/>
    </svg>
  );
}

function AppleIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.04C10.74 2.04 9 3.48 9 5.28c0 1.26.78 2.64 2.16 2.64 1.32 0 2.88-1.44 2.88-3.12 0-1.14-.72-2.76-2.04-2.76zM15.48 8.16c-1.5 0-2.58.96-3.48.96-.9 0-2.16-.96-3.48-.96-1.8 0-3.6 1.08-4.5 2.76-1.92 3.36-.48 8.4 1.32 10.92.9 1.26 1.92 2.64 3.36 2.64 1.38 0 1.92-.84 3.6-.84 1.62 0 2.16.84 3.6.84 1.5 0 2.4-1.32 3.24-2.52.96-1.44 1.38-2.88 1.38-2.94-.06 0-2.76-1.02-2.76-4.14 0-2.58 2.16-3.84 2.22-3.9-1.2-1.8-3.06-2.04-3.66-2.04z"/>
    </svg>
  );
}

function PlayStoreIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M3.253 22.515c-.244-.244-.383-.585-.383-.934V2.419c0-.349.139-.69.383-.934L12.586 12l-9.333 10.515zM13.414 12.828l3.172 3.172-10.772 6.138 7.6-9.31zm6.91-3.93l3.374 1.921c.548.312.548 1.106 0 1.418l-3.374 1.921-3.714-3.714 3.714-3.546zM13.414 11.172l-7.6-9.31 10.772 6.138-3.172 3.172z"/>
    </svg>
  );
}
