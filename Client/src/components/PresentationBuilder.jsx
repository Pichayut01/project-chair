import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, MonitorPlay, Image as ImageIcon, UploadCloud, Calendar, ChevronLeft, ChevronRight, X, Play, Square, Settings } from 'lucide-react';

export default function PresentationBuilder({
  isCreator,
  onStartPresentation,
  onEndPresentation,
  onChangeSlide,
  onStartEvent,
  isPresentationActive,
  presentationSlideIndex,
  classroomEvents,
  onAddEvent,
  onTriggerEvent,
  onDeleteEvent,
  onSubmitAnswer,
  onEndEvent,
  currentUser,
}) {
  const [slides, setSlides] = useState([
    { id: 'slide-1', type: 'slide', image: null },
  ]);

  const [activeSlideId, setActiveSlideId] = useState(slides[0]?.id);
  const fileInputRef = useRef(null);

  // State สำหรับเปิด/ปิดเมนูเพิ่มหน้า และตำแหน่งของ Tooltip
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ bottom: 0, left: 0 });
  const addButtonRef = useRef(null);

  // States สำหรับ Drag and Drop
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Presentation State ภายใน Component
  const [isPresenting, setIsPresenting] = useState(false);
  const [currentPresentIndex, setCurrentPresentIndex] = useState(0);

  // Sync state ถ้ามีการนำเสนอจากภายนอกเข้ามา
  useEffect(() => {
    if (isPresentationActive !== undefined && isPresenting !== isPresentationActive) {
      setIsPresenting(isPresentationActive);
    }
  }, [isPresentationActive]);

  useEffect(() => {
    if (presentationSlideIndex !== undefined && currentPresentIndex !== presentationSlideIndex) {
      setCurrentPresentIndex(presentationSlideIndex);
    }
  }, [presentationSlideIndex]);

  // เพิ่มหน้าสไลด์ใหม่ (รองรับการเลือกประเภท)
  const handleAddSlide = (type) => {
    const newId = `slide-${Date.now()}`;
    const newSlide = { id: newId, type: type, image: null };
    if (type === 'event') {
      newSlide.eventId = null;
    }
    const newSlides = [...slides, newSlide];
    setSlides(newSlides);
    setActiveSlideId(newId);
    setShowAddMenu(false); // ปิดเมนูหลังกดเลือก
  };

  // ลบสไลด์
  const handleDeleteSlide = (e, id) => {
    e.stopPropagation();
    if (slides.length <= 1) return;
    
    const newSlides = slides.filter(slide => slide.id !== id);
    setSlides(newSlides);
    
    if (activeSlideId === id) {
      setActiveSlideId(newSlides[0].id);
    }
  };

  // จัดการเมื่ออัปโหลดรูปภาพ
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // สร้าง URL สำหรับพรีวิวรูปภาพแบบชั่วคราว
      // ในระบบจริงควรจะใช้ axios.post('/api/upload') เพื่อเก็บไฟล์ถาวร แต่เราใช้ blob url ก่อน 
      // หรือสามารถเปลี่ยนไปใช้ API Upload จริงก็ได้ (สมมติว่าตอนนี้ใช้ createObjectURL ไปก่อนเพื่อง่ายต่อการทดสอบ/ตัวอย่าง)
      const imageUrl = URL.createObjectURL(file);
      setSlides(slides.map(slide => 
        slide.id === activeSlideId ? { ...slide, image: imageUrl } : slide
      ));
    }
    // รีเซ็ตค่า input เผื่อผู้ใช้เลือกไฟล์เดิมอีกครั้ง
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ฟังก์ชันคำนวณตำแหน่งและเปิด/ปิดเมนู Tooltip
  const handleToggleMenu = (e) => {
    e.stopPropagation();
    if (!showAddMenu && addButtonRef.current) {
      const rect = addButtonRef.current.getBoundingClientRect();
      setMenuPos({
        bottom: window.innerHeight - rect.top + 12, // ให้เมนูลอยอยู่เหนือปุ่ม 12px
        left: rect.left + (rect.width / 2), // จัดให้อยู่กึ่งกลางปุ่มแนวนอน
      });
      setShowAddMenu(true);
    } else {
      setShowAddMenu(false);
    }
  };

  // --- ระบบ Drag & Drop แบบ Smooth ---
  const handleDragStart = (e, index) => {
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      setDraggedIndex(index);
    }, 0);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // อนุญาตให้วางได้
  };

  const handleDragLeave = (e, index) => {
    if (dragOverIndex === index) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDragOverIndex(null);
      setDraggedIndex(null);
      return;
    }

    const newSlides = [...slides];
    const draggedItem = newSlides[draggedIndex];
    
    newSlides.splice(draggedIndex, 1);
    newSlides.splice(dropIndex, 0, draggedItem);

    setSlides(newSlides);
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDragOverIndex(null);
    setDraggedIndex(null);
  };

  // --- ระบบนำเสนอ ---
  const handleStartPresenting = () => {
    setIsPresenting(true);
    setCurrentPresentIndex(0);
    if (onStartPresentation) {
      onStartPresentation(slides);
    }
  };

  const handleStopPresenting = () => {
    setIsPresenting(false);
    if (onEndPresentation) {
      onEndPresentation();
    }
  };

  const handleNextSlide = () => {
    if (currentPresentIndex < slides.length - 1) {
      const newIndex = currentPresentIndex + 1;
      setCurrentPresentIndex(newIndex);
      if (onChangeSlide) onChangeSlide(newIndex, slides[newIndex]);
    }
  };

  const handlePrevSlide = () => {
    if (currentPresentIndex > 0) {
      const newIndex = currentPresentIndex - 1;
      setCurrentPresentIndex(newIndex);
      if (onChangeSlide) onChangeSlide(newIndex, slides[newIndex]);
    }
  };

  const handleStartEventFromSlide = () => {
    const slide = slides[currentPresentIndex];
    if (slide && slide.type === 'event' && onStartEvent) {
      onStartEvent(slide);
    }
  };

  // Keyboard Navigation
  useEffect(() => {
    if (!isPresenting) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        handleStopPresenting();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, currentPresentIndex, slides.length]);


  const activeSlideData = isPresenting ? slides[currentPresentIndex] : slides.find(s => s.id === activeSlideId);

  // ถ้าเป็นโหมดการนำเสนอ (หน้าจอสำหรับครูตอนกำลังพรีเซนต์)
  if (isPresenting) {
    return (
      <div className="flex flex-col h-full bg-slate-900 text-white font-sans w-full relative">
        {/* Topbar Navigation */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700/50 absolute top-0 left-0 right-0 z-20">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              LIVE
            </div>
            <span className="text-slate-400 text-sm font-medium">สไลด์ {currentPresentIndex + 1} / {slides.length}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={handlePrevSlide} 
              disabled={currentPresentIndex === 0}
              className="p-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button 
              onClick={handleNextSlide} 
              disabled={currentPresentIndex === slides.length - 1}
              className="p-2 bg-slate-700/50 text-white rounded-lg hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <button 
            onClick={handleStopPresenting}
            className="flex items-center space-x-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-red-500/20"
          >
            <Square className="w-4 h-4" />
            <span>จบนำเสนอ</span>
          </button>
        </div>

        {/* Main Slide Content (Presenting) */}
        <main className="flex-1 flex items-center justify-center p-8 mt-16 pb-32">
          <div className="w-full max-w-6xl aspect-video bg-white rounded-2xl shadow-2xl overflow-hidden relative flex items-center justify-center">
            {activeSlideData?.type === 'event' ? (
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 bg-emerald-50">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-3xl font-bold text-emerald-800 mb-3">หน้าต่างกิจกรรม</h2>
                <p className="text-gray-500 text-lg mb-8 text-center max-w-md">กดปุ่มด้านล่างเพื่อเริ่มกิจกรรมให้นักเรียนเข้าร่วม</p>
                <button 
                  onClick={handleStartEventFromSlide}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center space-x-3 shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-1"
                >
                  <Play className="w-6 h-6 fill-current" />
                  <span>เริ่ม Event ทันที</span>
                </button>
              </div>
            ) : activeSlideData?.image ? (
              <img src={activeSlideData.image} alt="Presenting Slide" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full bg-slate-50 text-slate-300">
                <ImageIcon className="w-24 h-24 mb-4" />
                <span>ไม่มีรูปภาพในสไลด์นี้</span>
              </div>
            )}
          </div>
        </main>

        {/* Thumbnail Strip (Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-slate-800/90 backdrop-blur-md border-t border-slate-700 flex items-center px-6 overflow-x-auto gap-3 py-3">
          {slides.map((slide, idx) => (
            <div 
              key={slide.id}
              onClick={() => {
                setCurrentPresentIndex(idx);
                if (onChangeSlide) onChangeSlide(idx, slides[idx]);
              }}
              className={`flex-shrink-0 w-32 aspect-video rounded-lg overflow-hidden cursor-pointer transition-all ${idx === currentPresentIndex ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-slate-800 opacity-100 scale-105' : 'opacity-40 hover:opacity-70 border border-slate-600'}`}
            >
              {slide.type === 'event' ? (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
              ) : slide.image ? (
                <img src={slide.image} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // โหมดสร้างสไลด์ปกติ (Builder Mode)
  return (
    <div className="flex flex-col h-full bg-gray-50 text-gray-800 font-sans relative w-full rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      {/* Top Bar for Builder */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
        <div>
          <h2 className="text-xl font-bold text-gray-800">สร้างสไลด์การสอน</h2>
          <p className="text-sm text-gray-500">สร้างสไลด์เนื้อหาและแทรกกิจกรรม (Event) เข้าไปเพื่อให้ผู้เรียนมีส่วนร่วม</p>
        </div>
        <button 
          onClick={handleStartPresenting}
          disabled={slides.length === 0}
          className="bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>เริ่มนำเสนอ</span>
        </button>
      </div>

      {/* Input ไฟล์ซ่อนไว้ */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImageUpload} 
        className="hidden" 
        accept="image/*" 
      />

      {/* พื้นที่สไลด์หลัก */}
      <main className="flex-1 overflow-auto flex items-center justify-center p-8 bg-gray-50 relative">
        {activeSlideData && (
          <div className="w-full max-w-4xl aspect-video bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl flex items-center justify-center overflow-hidden relative group border border-gray-200">
            
            {activeSlideData.type === 'event' ? (
              /* หน้าจอสำหรับ Event */
              <div className="flex flex-col items-center justify-center w-full h-full text-gray-500 bg-emerald-50/30">
                <div className="w-24 h-24 bg-emerald-100/50 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="w-12 h-12 text-emerald-600" />
                </div>
                <span className="text-2xl font-bold text-emerald-800 mb-2">หน้าต่างกิจกรรม (Event)</span>
                <p className="text-gray-500 text-center px-10 mb-6">คุณสามารถตั้งค่ากิจกรรมที่จะให้แสดงในสไลด์หน้านี้ (เช่น สร้าง Poll, Random นักเรียน)</p>
                <button className="flex items-center space-x-2 bg-white border border-emerald-200 hover:bg-emerald-50 text-emerald-700 px-6 py-3 rounded-full shadow-sm transition-colors font-medium">
                  <Settings className="w-5 h-5" />
                  <span>ตั้งค่ากิจกรรม</span>
                </button>
              </div>
            ) : activeSlideData.image ? (
              <>
                {/* แสดงรูปภาพ ปรับจาก object-contain เป็น object-cover เพื่อให้เต็มกรอบพอดี */}
                <img 
                  src={activeSlideData.image} 
                  alt="Slide content" 
                  className="w-full h-full object-cover bg-gray-50/50"
                />
                {/* ปุ่มเปลี่ยนรูป (แสดงตอน Hover) */}
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-6 right-6 bg-black/40 hover:bg-black/60 text-white px-5 py-2.5 rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center space-x-2 shadow-lg"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span className="text-sm font-medium">เปลี่ยนรูปภาพ</span>
                </button>
              </>
            ) : (
              /* ปุ่ม + ตรงกลางสำหรับหน้าว่าง */
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-emerald-600 hover:bg-emerald-50/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="w-20 h-20 bg-gray-50 group-hover:bg-emerald-100/50 rounded-full flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-105">
                  <Plus className="w-10 h-10" />
                </div>
                <span className="text-lg font-medium">คลิกเพื่อเพิ่มรูปภาพ</span>
              </button>
            )}

          </div>
        )}
      </main>

      {/* แถบ Thumbnail ด้านล่าง */}
      <footer className="h-44 bg-white border-t border-gray-100 flex flex-col z-10 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.03)] rounded-b-2xl">
        <div 
          className="flex-1 flex items-center px-4 overflow-x-auto custom-scrollbar"
          onScroll={() => { if (showAddMenu) setShowAddMenu(false); }} // ปิดเมนูอัตโนมัติถ้ามีการเลื่อน
        >
          
          <div className="flex items-center h-full px-2 py-2">
            {slides.map((slide, index) => {
              // คำนวณแอนิเมชันขยับหลบเมื่อมีการลากผ่าน
              let transformStyle = '';
              if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== index) {
                if (draggedIndex < index && dragOverIndex >= index) {
                  transformStyle = '-translate-x-4'; // ขยับไปซ้าย
                } else if (draggedIndex > index && dragOverIndex <= index) {
                  transformStyle = 'translate-x-4'; // ขยับไปขวา
                }
              }

              return (
                <div 
                  key={slide.id}
                  className={`
                    relative group flex-shrink-0 flex flex-col items-center mx-2 transition-all duration-300 ease-in-out
                    ${draggedIndex === index ? 'opacity-0 w-0 mx-0 overflow-hidden' : 'opacity-100 w-40'}
                    ${transformStyle}
                  `}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={(e) => handleDragEnter(e, index)}
                  onDragOver={handleDragOver}
                  onDragLeave={(e) => handleDragLeave(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <span className="text-xs text-gray-400 mb-1 font-medium">{index + 1}</span>
              
                  <div 
                    onClick={() => setActiveSlideId(slide.id)}
                    className={`
                      w-40 aspect-video rounded-2xl cursor-pointer relative overflow-hidden transition-all duration-300 flex items-center justify-center bg-gray-50
                      ${activeSlideId === slide.id ? 'ring-2 ring-emerald-500 ring-offset-2 shadow-md scale-[1.02]' : 'border border-gray-200/80 shadow-sm hover:border-emerald-300 hover:shadow'}
                    `}
                  >
                    {slide.type === 'event' ? (
                      <div className="flex flex-col items-center text-emerald-600">
                        <Calendar className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium">Event</span>
                      </div>
                    ) : slide.image ? (
                      <img src={slide.image} alt={`Slide ${index+1}`} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}

                    {/* ปุ่มลบ */}
                    {slides.length > 1 && (
                      <button 
                        onClick={(e) => handleDeleteSlide(e, slide.id)}
                        className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-md rounded-full text-gray-500 hover:text-red-500 hover:bg-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* ปุ่มเพิ่มสไลด์ด้านขวาสุด */}
            <div className="relative mx-4 flex flex-col items-center mt-5">
              <button 
                ref={addButtonRef}
                onClick={handleToggleMenu}
                className="w-40 aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-emerald-600 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-300 cursor-pointer group"
              >
                <div className="p-2 rounded-full group-hover:bg-emerald-100/50 transition-colors mb-1">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">เพิ่มหน้า</span>
              </button>
            </div>
            
          </div>
        </div>
      </footer>

      {/* Popup Menu แบบ Tooltip (ใช้ fixed positioning และจัดตำแหน่งแบบ Dynamic เพื่อไม่ให้โดนบัง) */}
      {showAddMenu && (
        <>
          <div 
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setShowAddMenu(false)}
          />
          <div 
            className="fixed z-50 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 w-52 animate-in fade-in zoom-in-95 duration-200 origin-bottom"
            style={{
              bottom: `${menuPos.bottom}px`,
              left: `${menuPos.left}px`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* ลูกศรชี้ลง (Tooltip Arrow) */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-gray-100 transform rotate-45 rounded-sm"></div>

            <div className="relative z-10 bg-white rounded-2xl p-2 flex flex-col">
              <button 
                onClick={() => handleAddSlide('slide')}
                className="flex items-center px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-all duration-200 text-left mb-1 group"
              >
                <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-100 transition-colors">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">สไลด์รูปภาพ</span>
              </button>

              <button 
                onClick={() => handleAddSlide('event')}
                className="flex items-center px-3 py-2.5 hover:bg-emerald-50 rounded-xl transition-all duration-200 text-left group"
              >
                <div className="p-2 bg-emerald-100/50 text-emerald-600 rounded-lg mr-3 group-hover:bg-emerald-100 transition-colors">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="font-semibold text-gray-800 text-sm">หน้ากิจกรรม</span>
              </button>
            </div>
          </div>
        </>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { height: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; border: 2px solid #f9fafb; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}} />
    </div>
  );
}
