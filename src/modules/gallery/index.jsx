import React, { useState, useEffect } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  Upload, 
  RotateCcw, 
  Save, 
  X, 
  Tag, 
  Layers
} from 'lucide-react';

const GALLERY_DEFAULTS = [
  {
    title: 'Statewide Student Rallies 2026',
    caption: 'Student delegates marching at the Telangana State Capitol for fee reimbursement reforms.',
    category: 'Campaigns',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1000&q=80'
  },
  {
    title: 'Anti-Ragging Vigilance Task Force',
    caption: 'Executive members releasing the 24/7 student emergency hotline posters.',
    category: 'Posters',
    image_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1000&q=80'
  }
];

const GalleryPanel = () => {
  const [images, setImages] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [category, setCategory] = useState('Activities');
  const [imageUrl, setImageUrl] = useState('');
  const [bulkUrls, setBulkUrls] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [previewItem, setPreviewItem] = useState(null);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const fetchGallery = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/modules/gallery', { headers });
      const data = await res.json();
      if (data.success && data.images) {
        setImages(data.images);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetForm = () => {
    setEditingId(null);
    setTitle('');
    setCaption('');
    setCategory('Activities');
    setImageUrl('');
    setBulkUrls('');
    setIsBulkMode(false);
  };

  const handleEdit = (item) => {
    setIsBulkMode(false);
    setEditingId(item.id);
    setTitle(item.title || '');
    setCaption(item.caption || '');
    setCategory(item.category || 'Activities');
    setImageUrl(item.image_url || '');
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (isBulkMode) {
      const urls = bulkUrls.split('\n').map(u => u.trim()).filter(Boolean);
      if (urls.length === 0) {
        alert('Please enter at least one image URL.');
        return;
      }
      const bulkPayload = {
        title: title || 'Gallery Asset',
        caption: caption || '',
        category: category || 'Activities',
        images: urls.map(url => ({ title, caption, category, image_url: url }))
      };

      try {
        const res = await fetch('/api/modules/gallery', {
          method: 'POST',
          headers,
          body: JSON.stringify(bulkPayload)
        });
        const data = await res.json();
        if (data.success) {
          alert('Bulk gallery images uploaded.');
          handleResetForm();
          fetchGallery();
        } else {
          alert(data.message || 'Error uploading bulk images.');
        }
      } catch (err) {
        alert('Failed to upload bulk images.');
      }
      return;
    }

    if (!imageUrl) {
      alert('Image URL is required.');
      return;
    }

    const payload = {
      title: title || 'Gallery Asset',
      caption: caption || '',
      category: category || 'Activities',
      image_url: imageUrl
    };

    try {
      let res;
      if (editingId) {
        res = await fetch(`/api/modules/gallery/${editingId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch('/api/modules/gallery', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (data.success) {
        alert(editingId ? 'Gallery item updated.' : 'Gallery item added.');
        handleResetForm();
        fetchGallery();
      } else {
        alert(data.message || 'Error saving gallery item.');
      }
    } catch (err) {
      alert('Failed to save gallery item.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return;
    try {
      const res = await fetch(`/api/modules/gallery/${id}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (data.success) {
        fetchGallery();
      }
    } catch (err) {
      alert('Error deleting image.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-400" /> Media Gallery Management
          </h2>
          <p className="text-xs text-slate-400">Upload and curate official photos, posters, and campaign archives. Auto-reflects on public Gallery page.</p>
        </div>

        <button
          onClick={() => setIsBulkMode(prev => !prev)}
          className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5 text-amber-400" />
          {isBulkMode ? 'Switch to Single Upload' : 'Batch / Multiple Upload'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Form Panel */}
        <form onSubmit={handleSave} className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              {editingId ? <Edit3 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
              {editingId ? 'Edit Image Details' : (isBulkMode ? 'Batch Upload Images' : 'Upload Single Image')}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={handleResetForm}
                className="text-[10px] text-rose-400 hover:underline flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Cancel Edit
              </button>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Image Title</label>
            <input
              type="text"
              placeholder="e.g. Campus Anti-Ragging Drive"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Caption / Description</label>
            <textarea
              rows={2}
              placeholder="Brief description..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
            >
              <option value="Activities">Activities</option>
              <option value="Events">Events</option>
              <option value="Campaigns">Campaigns</option>
              <option value="Posters">Posters</option>
            </select>
          </div>

          {!isBulkMode ? (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Image URL *</label>
              <input
                type="url"
                placeholder="https://..."
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 outline-none"
                required={!isBulkMode}
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Multiple Image URLs (1 per line) *</label>
              <textarea
                rows={4}
                placeholder="https://image1.jpg\nhttps://image2.jpg"
                value={bulkUrls}
                onChange={e => setBulkUrls(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-500 outline-none font-mono"
                required={isBulkMode}
              />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {editingId ? 'Save Changes' : (isBulkMode ? 'Upload All Images' : 'Save Image')}
            </button>
            
            <button
              type="button"
              onClick={() => {
                const sample = GALLERY_DEFAULTS[0];
                setTitle(sample.title);
                setCaption(sample.caption);
                setCategory(sample.category);
                setImageUrl(sample.image_url);
              }}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition font-semibold"
              title="Fill Sample Data"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Gallery Registry */}
        <div className="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-amber-400" /> Media Archives ({images.length})
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 max-h-[550px] overflow-y-auto pr-1">
            {images.map(img => (
              <div key={img.id} className="group relative bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
                <div className="w-full aspect-[4/3] relative overflow-hidden bg-slate-900">
                  <img src={img.image_url} alt={img.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 text-[9px] font-bold text-amber-400 uppercase">
                    {img.category || 'General'}
                  </div>
                </div>
                <div className="p-2.5 flex flex-col gap-1">
                  <span className="text-xs font-bold text-slate-200 truncate">{img.title || 'Media Item'}</span>
                  {img.caption && <p className="text-[10px] text-slate-400 truncate">{img.caption}</p>}
                </div>
                <div className="p-2 pt-0 flex justify-end gap-1">
                  <button onClick={() => setPreviewItem(img)} className="p-1 bg-slate-900 hover:text-blue-400 text-slate-400 rounded">
                    <Eye className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleEdit(img)} className="p-1 bg-slate-900 hover:text-amber-400 text-slate-400 rounded">
                    <Edit3 className="w-3 h-3" />
                  </button>
                  <button onClick={() => handleDelete(img.id)} className="p-1 bg-slate-900 hover:text-rose-400 text-slate-400 rounded">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {images.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-slate-500 italic">No media items uploaded.</div>
            )}
          </div>
        </div>

      </div>

      {/* Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 max-w-md w-full flex flex-col gap-3 text-slate-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-amber-400 uppercase">{previewItem.category || 'Media'} Preview</span>
              <button onClick={() => setPreviewItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={previewItem.image_url} alt={previewItem.title} className="w-full max-h-64 object-contain rounded-xl bg-black" />
            <h4 className="font-bold text-white text-sm">{previewItem.title}</h4>
            {previewItem.caption && <p className="text-xs text-slate-400">{previewItem.caption}</p>}
          </div>
        </div>
      )}

    </div>
  );
};

export default {
  id: 'gallery',
  name: 'Gallery Management',
  icon: 'Image',
  panels: [
    { id: 'manager', name: 'Media Manager', component: GalleryPanel }
  ],
  searchIndex: [
    { query: 'Upload gallery photos', action: 'manager' },
    { query: 'Manage event media assets', action: 'manager' }
  ]
};
