import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useParams, 
  useNavigate,
  useLocation
} from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  ExternalLink,
  Loader2,
  Trash2,
  Plus,
  ArrowLeft,
  MessageSquare,
  Pin,
  ThumbsUp,
  ThumbsDown,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronUp,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  MoreHorizontal
} from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Personio_Logo.svg/1280px-Personio_Logo.svg.png";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Navbar = () => (
  <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-semibold text-zinc-900 group">
        <img 
          src={LOGO_URL} 
          alt="Personio" 
          className="h-6 w-auto group-hover:scale-105 transition-transform"
          referrerPolicy="no-referrer"
        />
      </Link>
      <div className="flex items-center gap-4">
        <Link 
          to="/admin" 
          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors flex items-center gap-1.5"
        >
          <LayoutDashboard size={16} />
          Dashboard
        </Link>
      </div>
    </div>
  </nav>
);

const Home = () => {
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pdfs')
      .then(res => res.json())
      .then(data => {
        setPdfs(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 tracking-tight mb-4">
          Your Document Library
        </h1>
        <p className="text-zinc-500 max-w-2xl mx-auto">
          Access and share your PDF documents with unique page-level URLs. 
          Professional viewing experience for every page.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      ) : pdfs.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed border-zinc-200 rounded-2xl">
          <FileText className="mx-auto text-zinc-300 mb-4" size={48} />
          <h3 className="text-lg font-medium text-zinc-900">No documents yet</h3>
          <p className="text-zinc-500 mb-6">Start by uploading a PDF in the dashboard.</p>
          <Link 
            to="/admin" 
            className="inline-flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-zinc-800 transition-all"
          >
            <Plus size={18} />
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group bg-white border border-zinc-200 rounded-2xl p-6 hover:shadow-xl hover:shadow-zinc-200/50 transition-all"
            >
              <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center text-zinc-400 mb-4 group-hover:bg-zinc-900 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900 mb-1 truncate">{pdf.name}</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Uploaded {new Date(pdf.created_at).toLocaleDateString()}
              </p>
              <Link 
                to={`/pdf/${pdf.id}/page/1`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-zinc-50 text-zinc-900 rounded-xl font-medium hover:bg-zinc-900 hover:text-white transition-all"
              >
                View Document
                <ExternalLink size={16} />
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboard = () => {
  const [file, setFile] = useState<File | null>(null);
  const [greeting, setGreeting] = useState("");
  const [uploading, setUploading] = useState(false);
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const fetchPdfs = () => {
    fetch('/api/pdfs')
      .then(res => res.json())
      .then(setPdfs);
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const res = await fetch('/api/pdfs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: file.name, content: base64, greeting })
        });
        if (res.ok) {
          setFile(null);
          setGreeting("");
          fetchPdfs();
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
  };

  return (
    <div className="min-h-screen bg-zinc-50/50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <header className="mb-10">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Management Console</h1>
          <p className="text-zinc-500 mt-1">Upload, organize, and monitor your document distribution.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-zinc-200 rounded-2xl p-6 sticky top-24 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">New Document</h2>
              <form onSubmit={handleUpload} className="space-y-4">
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={cn(
                    "relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200",
                    dragActive ? "border-zinc-900 bg-zinc-50 scale-[1.02]" : "border-zinc-200 hover:border-zinc-300",
                    file ? "border-emerald-500 bg-emerald-50/30" : ""
                  )}
                >
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-colors",
                      file ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
                    )}>
                      {file ? <FileText size={24} /> : <Upload size={24} />}
                    </div>
                    {file ? (
                      <div className="animate-in fade-in slide-in-from-bottom-2">
                        <p className="text-sm font-semibold text-zinc-900 truncate max-w-[180px]">{file.name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-zinc-900">Drop PDF here</p>
                        <p className="text-xs text-zinc-400 mt-1">or click to browse</p>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Greeting Message</label>
                  <textarea 
                    value={greeting}
                    onChange={(e) => setGreeting(e.target.value)}
                    placeholder="Welcome your readers with a custom message..."
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all resize-none h-24"
                  />
                </div>
                
                <button 
                  type="submit"
                  disabled={!file || uploading}
                  className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  {uploading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  {uploading ? 'Processing...' : 'Upload to Library'}
                </button>
                
                {file && !uploading && (
                  <button 
                    type="button"
                    onClick={() => setFile(null)}
                    className="w-full py-2 text-xs font-medium text-zinc-400 hover:text-zinc-600 transition-colors"
                  >
                    Cancel selection
                  </button>
                )}
              </form>
            </div>
          </div>

          {/* List Section */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/30">
                <h2 className="text-sm font-semibold text-zinc-900">Active Documents</h2>
                <span className="text-xs font-medium px-2 py-1 bg-zinc-100 text-zinc-500 rounded-md">
                  {pdfs.length} Total
                </span>
              </div>
              <div className="divide-y divide-zinc-100">
                {pdfs.map((pdf) => (
                  <motion.div 
                    layout
                    key={pdf.id} 
                    className="px-6 py-5 flex items-center justify-between group hover:bg-zinc-50/80 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-900 rounded-lg flex items-center justify-center text-white shadow-sm">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-zinc-900 group-hover:text-zinc-900 transition-colors">{pdf.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            <LayoutDashboard size={12} />
                            ID: {pdf.id}
                          </span>
                          <span className="text-xs text-zinc-400 flex items-center gap-1">
                            Uploaded {new Date(pdf.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        to={`/pdf/${pdf.id}/page/1`}
                        className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-all"
                        title="View Live"
                      >
                        <ExternalLink size={18} />
                      </Link>
                    </div>
                  </motion.div>
                ))}
                {pdfs.length === 0 && (
                  <div className="px-6 py-20 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="text-zinc-200" size={32} />
                    </div>
                    <p className="text-zinc-400 font-medium">No documents found in your library.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PDFViewer = () => {
  const { id, pageNumber } = useParams();
  const navigate = useNavigate();
  const [pdfData, setPdfData] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1.0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFullGreeting, setShowFullGreeting] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const pageRefs = React.useRef<Map<number, HTMLDivElement>>(new Map());

  const currentPage = parseInt(pageNumber || '1', 10);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/pdfs/${id}`)
      .then(res => res.json())
      .then(data => {
        setPdfData(data);
        setLoading(false);
      });
  }, [id]);

  // Handle container resize for responsiveness
  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width - 96); // Subtract padding
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [loading]);

  // Handle initial scroll to page from URL
  useEffect(() => {
    if (!loading && numPages > 0) {
      const targetPage = parseInt(pageNumber || '1', 10);
      if (targetPage > 1) {
        // Small delay to ensure pages are rendered
        setTimeout(() => {
          scrollToPage(targetPage);
        }, 500);
      }
    }
  }, [loading, numPages]);

  // Handle intersection observer to update URL on scroll
  useEffect(() => {
    if (loading || !numPages) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1', 10);
            if (pageNum !== currentPage) {
              navigate(`/pdf/${id}/page/${pageNum}`, { replace: true });
            }
          }
        });
      },
      { threshold: 0.5, root: containerRef.current }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [loading, numPages, id, currentPage, navigate]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const scrollToPage = (page: number) => {
    const ref = pageRefs.current.get(page);
    if (ref) {
      ref.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = `data:application/pdf;base64,${pdfData.content}`;
    link.download = `${pdfData.name}.pdf`;
    link.click();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-white z-[100]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="mb-6"
        >
          <Loader2 size={48} className="text-zinc-200" />
        </motion.div>
        <p className="text-zinc-400 font-sans text-sm tracking-tight animate-pulse">
          Loading document...
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F3F0F5] overflow-hidden relative font-sans">
      {/* Sidebar */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 300, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="bg-white flex flex-col overflow-hidden border-r border-zinc-100 z-30"
          >
            <div className="p-6 flex flex-col h-full">
              {/* Logo */}
              <div className="mb-8">
                <img src={LOGO_URL} alt="Personio" className="h-8 w-auto" />
              </div>

              {/* Profile Section */}
              <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 cursor-pointer transition-colors mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">
                    P
                  </div>
                  <span className="text-sm font-semibold text-zinc-900">Personio Talent Team</span>
                </div>
                <ChevronRight size={16} className="text-zinc-400" />
              </div>

              {/* Greeting */}
              <div className="mb-8">
                <div className={cn(
                  "text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap",
                  !showFullGreeting && "line-clamp-4"
                )}>
                  {pdfData?.greeting || "Hi there,\n\nThank you again for your interest in Personio!\n\nIn this document you will find information about our interview process."}
                </div>
                {pdfData?.greeting && pdfData.greeting.length > 100 && (
                  <button 
                    onClick={() => setShowFullGreeting(!showFullGreeting)}
                    className="text-xs font-bold text-zinc-400 mt-2 hover:text-zinc-900 transition-colors"
                  >
                    {showFullGreeting ? "Show less" : "Show more"}
                  </button>
                )}
              </div>

              {/* Document Card */}
              <div className="mt-auto mb-8">
                <div className="p-3 border border-zinc-200 rounded-xl flex items-center gap-3 bg-white shadow-sm">
                  <div className="w-10 h-10 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-400">
                    <FileText size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-zinc-900 truncate">{pdfData?.name}</p>
                  </div>
                </div>
              </div>

              {/* Footer Links */}
              <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium">
                <a href="#" className="hover:text-zinc-900">Imprint</a>
                <span>|</span>
                <a href="#" className="hover:text-zinc-900">Privacy Policy</a>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Sidebar Toggle Button */}
      <button 
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className={cn(
          "absolute top-1/2 -translate-y-1/2 z-40 w-6 h-12 bg-white border border-zinc-200 rounded-r-lg flex items-center justify-center text-zinc-400 hover:text-zinc-900 shadow-sm transition-all",
          sidebarOpen ? "left-[300px]" : "left-0"
        )}
      >
        {sidebarOpen ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Header */}
        <div className="h-14 px-6 flex items-center justify-between">
          <button className="flex items-center gap-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
            <Pin size={14} className="rotate-45" />
            Pin a comment
          </button>
        </div>

        {/* Scrollable PDF Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-y-auto pt-4 md:pt-12 px-4 md:px-12 pb-0 custom-scrollbar scroll-smooth"
        >
          <Document
            file={`data:application/pdf;base64,${pdfData?.content}`}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={<Loader2 className="animate-spin text-zinc-300" size={40} />}
          >
            {Array.from(new Array(numPages), (el, index) => (
              <div 
                key={`page_${index + 1}`}
                data-page-number={index + 1}
                ref={(el) => {
                  if (el) pageRefs.current.set(index + 1, el);
                  else pageRefs.current.delete(index + 1);
                }}
                className="relative"
              >
                <div className="shadow-2xl shadow-zinc-900/10 bg-white rounded-sm overflow-hidden">
                  <Page 
                    pageNumber={index + 1} 
                    width={containerWidth || undefined}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    devicePixelRatio={Math.min(2, window.devicePixelRatio)}
                  />
                </div>
              </div>
            ))}
          </Document>
        </div>

        {/* Floating Bottom Toolbar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
          <div className="bg-white/90 backdrop-blur-md border border-zinc-200 rounded-full px-4 py-2 flex items-center gap-4 shadow-xl">
            {/* Page Nav */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => scrollToPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                <ChevronUp size={18} />
              </button>
              <div className="flex items-center gap-1 text-xs font-bold text-zinc-900 min-w-[40px] justify-center">
                {currentPage} / {numPages}
                <ChevronDown size={12} className="text-zinc-400" />
              </div>
              <button 
                onClick={() => scrollToPage(currentPage + 1)}
                disabled={currentPage >= numPages}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 disabled:opacity-30 transition-colors"
              >
                <ChevronDown size={18} />
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Zoom */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setScale(s => Math.min(2.5, s + 0.1))}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ZoomIn size={18} />
              </button>
              <button 
                onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
              >
                <ZoomOut size={18} />
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Fit */}
            <div className="flex items-center gap-1">
              <button 
                onClick={() => { setScale(1.0); setContainerWidth(containerRef.current ? containerRef.current.clientWidth - 96 : null); }}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Fit to Width"
              >
                <Maximize2 size={18} />
              </button>
              <button 
                onClick={() => { setScale(0.8); setContainerWidth(null); }}
                className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
                title="Actual Size"
              >
                <Minimize2 size={18} />
              </button>
            </div>

            <div className="h-4 w-px bg-zinc-200" />

            {/* Download */}
            <button 
              onClick={downloadPdf}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 transition-colors"
            >
              <Download size={18} />
            </button>
          </div>

          {/* Feedback */}
          <div className="flex items-center gap-2">
            <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-xl transition-all">
              <ThumbsDown size={18} />
            </button>
            <button className="w-10 h-10 bg-white/90 backdrop-blur-md border border-zinc-200 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-900 shadow-xl transition-all">
              <ThumbsUp size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/pdf/:id/page/:pageNumber" element={<PDFViewer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
