import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Maximize2, X, Filter, Sparkles, Calendar, Tag } from 'lucide-react';
import GlassCard from '../components/GlassCard';
import AnimatedSection from '../components/AnimatedSection';
import { useOrg } from '../context/OrgContext';

export default function Gallery() {
  const { shortName, fullName } = useOrg();

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [activeLightbox, setActiveLightbox] = useState(null);

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('trsv_session_token');
      const res = await fetch('/api/modules/gallery', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      }
    } catch (err) {
      console.warn('Failed to fetch gallery:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', 'ACTIVITIES', 'EVENTS', 'CAMPAIGNS', 'POSTERS'];

  const filteredImages = images.filter(img => {
    if (selectedCategory === 'ALL') return true;
    return (img.category || '').toUpperCase() === selectedCategory;
  });

  return (
    <div className="w-full flex flex-col gap-8 py-8 animate-fadeIn text-left">
      
      {/* Header */}
      <AnimatedSection direction="up" className="text-center max-w-3xl mx-auto flex flex-col gap-3">
        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 tracking-widest uppercase flex items-center justify-center gap-2">
          <ImageIcon className="w-4 h-4 text-amber-500" /> Media Archives & Visual Chronicle
        </span>
        <h1 className="fluid-heading-2 font-bold text-slate-900 dark:text-white leading-tight">
          {shortName} Media Gallery
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Photo records of campus rallies, state assemblies, grievance redressal drives, and youth leadership initiatives across Telangana.
        </p>
      </AnimatedSection>

      {/* Category Filter Pills */}
      <AnimatedSection delay={0.05} className="flex justify-center">
        <div className="flex flex-wrap gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-blue-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </AnimatedSection>

      {/* Gallery Grid */}
      <AnimatedSection delay={0.1} className="flex flex-col gap-6">
        {loading ? (
          <div className="w-full py-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500">Loading gallery archives...</span>
          </div>
        ) : filteredImages.length === 0 ? (
          <GlassCard className="p-12 text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Images Available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                No media items are currently uploaded under the "{selectedCategory}" category.
              </p>
            </div>
          </GlassCard>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredImages.map((imgItem) => (
              <GlassCard 
                key={imgItem.id} 
                hoverEffect 
                className="group p-0 overflow-hidden flex flex-col cursor-pointer"
                onClick={() => setActiveLightbox(imgItem)}
              >
                <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-900">
                  <img 
                    src={imgItem.image_url} 
                    alt={imgItem.title || 'Gallery Image'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-white text-xs font-bold flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-400" /> Click to expand
                    </span>
                  </div>
                  {imgItem.category && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] font-bold text-amber-400 uppercase">
                      {imgItem.category}
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-1">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {imgItem.title || 'Untitled Media'}
                  </h3>
                  {imgItem.caption && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {imgItem.caption}
                    </p>
                  )}
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </AnimatedSection>

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveLightbox(null)}
        >
          <div 
            className="relative max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveLightbox(null)}
              className="absolute top-4 right-4 z-10 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 backdrop-blur-md transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-full max-h-[70vh] flex items-center justify-center bg-black p-2">
              <img 
                src={activeLightbox.image_url} 
                alt={activeLightbox.title} 
                className="max-h-[68vh] w-auto max-w-full object-contain"
              />
            </div>

            <div className="p-6 flex flex-col gap-2 text-left bg-slate-900">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">
                  {activeLightbox.title || 'Media Detail'}
                </h3>
                {activeLightbox.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {activeLightbox.category}
                  </span>
                )}
              </div>
              {activeLightbox.caption && (
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeLightbox.caption}
                </p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
