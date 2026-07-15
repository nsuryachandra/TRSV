import React, { useState, useEffect } from 'react';
import { FileText, Plus, Search, Calendar, Download, Eye, Award, CheckCircle, FileCheck, Landmark, RotateCcw } from 'lucide-react';

const DOCUMENT_DEFAULTS = {
  docType: 'Appointment',
  recipientName: 'Ch. Karthik Yadav',
  content: 'By order of the TVRS State Executive Council, you are hereby appointed as the District General Secretary for Hyderabad constituency. You are authorised to oversee and coordinate all student representation activities in your designated area with immediate effect. You shall report directly to the State President on all matters of governance and student welfare.'
};

const DocumentsPanel = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generator states
  const [docType, setDocType] = useState('Appointment');
  const [recipientName, setRecipientName] = useState('');
  const [content, setContent] = useState('');
  const [viewingDoc, setViewingDoc] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const token = localStorage.getItem('trsv_session_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/modules/documents', { headers });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!recipientName || !content) {
      alert('All generation fields are required.');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/modules/documents/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          doc_type: docType,
          recipient_name: recipientName,
          content
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Official document generated successfully.');
        setRecipientName('');
        setContent('');
        fetchDocuments();
      }
    } catch (err) {
      alert('Error generating document.');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDocs = documents.filter(d => 
    d.recipient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.doc_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.doc_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" /> TVRS Document Engine
          </h2>
          <p className="text-xs text-slate-400">Generate appointments, promotions, appreciation letters and circulars with auto-numbering and verification QR links.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Generate Document Form */}
        <form onSubmit={handleGenerate} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Plus className="w-4 h-4 text-cyan-400" /> New Document Dispatch
          </h3>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Type</label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:border-cyan-500 outline-none"
            >
              <option value="Appointment">Appointment Letter</option>
              <option value="Promotion">Promotion Letter</option>
              <option value="Appreciation">Appreciation Certificate</option>
              <option value="Official">Official Letter</option>
              <option value="Circular">Circular / Bulletin</option>
              <option value="Authorization">Authorization Letter</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recipient Full Name</label>
            <input
              type="text"
              placeholder="e.g. Ch. Karthik Yadav"
              value={recipientName}
              onChange={e => setRecipientName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Document Content & Clauses</label>
            <textarea
              rows={6}
              placeholder="Detail the designation assignment, duration terms, promotion scopes or message body here..."
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500 outline-none font-sans leading-relaxed"
              required
            />
          </div>

          <button
            type="submit"
            disabled={actionLoading}
            className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition"
          >
            Generate &amp; Sign Document
          </button>
          <button
            type="button"
            onClick={() => {
              setDocType(DOCUMENT_DEFAULTS.docType);
              setRecipientName(DOCUMENT_DEFAULTS.recipientName);
              setContent(DOCUMENT_DEFAULTS.content);
            }}
            className="w-full py-2 flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-xs transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Fill Defaults
          </button>
        </form>

        {/* Right Columns: Registry Ledger */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Landmark className="w-4 h-4 text-amber-500" /> Dispatch Registry Ledger
            </h3>
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search registry..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-9 pr-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            </div>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {filteredDocs.map(doc => (
              <div key={doc.id} className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-start gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-200">{doc.doc_number}</span>
                    <span className="text-[9px] bg-slate-800 border border-slate-700/50 text-slate-300 px-2 py-0.5 rounded">
                      {doc.doc_type}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">Recipient: <span className="text-slate-200 font-medium">{doc.recipient_name}</span></div>
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">"{doc.content}"</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" /> {new Date(doc.created_at).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="flex items-center gap-1 px-3 py-1 bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/40 text-cyan-400 rounded text-xs transition"
                  >
                    <Eye className="w-3.5 h-3.5" /> View & Print
                  </button>
                </div>
              </div>
            ))}
            {filteredDocs.length === 0 && (
              <p className="text-xs text-slate-500 italic text-center py-6">No documents matched your filter.</p>
            )}
          </div>
        </div>

      </div>

      {/* Printable Preview Overlay */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-55 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-xl max-w-2xl w-full p-8 shadow-2xl relative space-y-6">
            
            {/* Header branding */}
            <div className="flex justify-between items-center border-b-2 border-amber-500 pb-4">
              <div className="flex items-center gap-3">
                <img src="/trsvlogo.jpeg" alt="TVRS LOGO" className="w-12 h-12 object-contain" />
                <div>
                  <h1 className="text-lg font-bold tracking-tight text-slate-900">TELANGANA VIDYARTHI RAKSHANA SENA</h1>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">State Executive Governance Board</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-mono font-bold text-slate-700">{viewingDoc.doc_number}</div>
                <div className="text-[10px] text-slate-400">Date: {new Date(viewingDoc.created_at).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Document Title */}
            <div className="text-center py-2">
              <h2 className="text-base font-bold underline tracking-widest text-slate-800 uppercase">
                {viewingDoc.doc_type} LETTER
              </h2>
            </div>

            {/* Address */}
            <div className="text-xs text-slate-700 space-y-0.5">
              <div>To,</div>
              <div className="font-bold text-slate-900">{viewingDoc.recipient_name}</div>
              <div>Telangana Vidyarthi Rakshana Sena (TVRS)</div>
            </div>

            {/* Body */}
            <div className="text-xs leading-relaxed text-slate-800 space-y-4 whitespace-pre-wrap min-h-[150px]">
              {viewingDoc.content}
            </div>

            {/* Signatures and QR Code */}
            <div className="flex justify-between items-end border-t border-slate-200 pt-6">
              <div className="space-y-4">
                <div className="text-[10px] text-slate-500 italic">This is a digitally signed official credential.</div>
                <div className="text-xs font-bold text-slate-800">
                  <div>State President</div>
                  <div className="text-[10px] text-slate-400 font-normal">Authorized Signatory</div>
                </div>
              </div>
              
              {/* QR Verification Link */}
              <div className="flex flex-col items-center space-y-1">
                <div className="w-20 h-20 bg-slate-100 flex items-center justify-center border border-slate-200 rounded p-1">
                  {/* Since we don't have a live canvas QR code writer inside simple React without libraries, we draw a premium placeholder containing verification text */}
                  <div className="text-[8px] text-center font-mono text-slate-600 break-all select-none">
                    {window.location.origin}/verify/{viewingDoc.qr_token}
                  </div>
                </div>
                <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Scan to Verify</span>
              </div>
            </div>

            {/* Controls */}
            <div className="absolute right-4 top-2 flex gap-2 no-print">
              <button 
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Print / PDF
              </button>
              <button 
                onClick={() => setViewingDoc(null)}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default {
  id: 'documents',
  name: 'Documents',
  icon: 'FileText',
  panels: [
    { id: 'ledger', name: 'Document Engine', component: DocumentsPanel }
  ],
  searchIndex: [
    { query: 'Generate official letters', action: 'ledger' },
    { query: 'Generate appointment certificates', action: 'ledger' }
  ]
};

