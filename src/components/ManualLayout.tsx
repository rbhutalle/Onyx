import { useEffect, useState } from 'react';
import { Search, Printer, Cpu, ArrowLeft, FileText, BookOpen, PlayCircle, Download, ExternalLink, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import localManualPdf from '@/assets/documents/RCMRO_User_Manual.pdf';

type ManualSection = 'maintenance-manual';

export function Manual() {
  const [activeSection, setActiveSection] = useState<ManualSection>('maintenance-manual');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Scroll progress bar & Keyboard navigation setup
  useEffect(() => {
    const progressBar = document.getElementById('readingProgress');
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop || document.body.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      if (progressBar) progressBar.style.width = `${scrolled}%`;

      const btnBackToTop = document.getElementById('btnBackToTop');
      if (btnBackToTop) {
        if (window.scrollY > 400) {
          btnBackToTop.classList.remove('opacity-0', 'invisible');
          btnBackToTop.classList.add('opacity-100', 'visible');
        } else {
          btnBackToTop.classList.remove('opacity-100', 'visible');
          btnBackToTop.classList.add('opacity-0', 'invisible');
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const searchInput = document.getElementById('manualSearchInput') as HTMLInputElement;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (searchInput && e.key === '/' && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
      } else if (e.key === 'Escape') {
        if (document.activeElement === searchInput) searchInput.blur();
      }
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const term = ((e.target as HTMLInputElement)?.value ?? '').toLowerCase().trim();
        const contentCards = document.querySelectorAll('.manual-content-card');
        if (!term) {
          contentCards.forEach((el) => {
            (el as HTMLElement).style.opacity = '1';
            (el as HTMLElement).style.transition = 'opacity 0.3s ease';
          });
          return;
        }
        contentCards.forEach((el) => {
          const text = ((el as HTMLElement)?.innerText ?? '').toLowerCase();
          (el as HTMLElement).style.transition = 'opacity 0.3s ease';
          if (text.includes(term)) {
            (el as HTMLElement).style.opacity = '1';
          } else {
            (el as HTMLElement).style.opacity = '0.2';
          }
        });
      });
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="h-[calc(100vh-140px)] w-full max-w-6xl mx-auto px-4 sm:px-6 space-y-3 text-(--text-primary) font-sans antialiased relative overflow-x-hidden scroll-smooth">
      {/* Top Reading Progress Bar */}
      <div id="readingProgress" className="fixed top-16 left-0 h-1 w-0 bg-linear-to-r from-blue-500 via-cyan-400 to-emerald-500 z-55 transition-all duration-150 shadow-[0_0_12px_rgba(59,130,246,0.8)]"></div>

      {/* Top Fixed Header */}
      <header className="shrink-0 fixed top-0 left-0 right-0 h-16 bg-(--bg-surface)/90 backdrop-blur-xl border-b border-(--border-main) z-50 flex items-center justify-between px-7 shadow-lg">
        <div className="flex items-center gap-3">
          {/* Floating Sidebar Toggle Button for Tablet/Mobile */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
            className="p-2 bg-(--bg-elevated) hover:bg-(--bg-card-hover) text-(--text-secondary) border border-(--border-main) rounded-xl transition-colors cursor-pointer flex items-center justify-center shadow-xs"
          >
            {isSidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link to="/" className="flex items-center gap-3 no-underline opacity-90 hover:opacity-100 transition-all hover:scale-[1.02]">
            <div className="w-9.5 h-9.5 bg-(--btn-primary-bg) text-(--btn-primary-text) rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.45)] border border-white/20 transition-transform duration-300 hover:rotate-6">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="text-lg font-extrabold tracking-tight text-(--text-primary)">RC-MRO</div>
              <div className="text-[0.72rem] font-bold text-cyan-400 uppercase tracking-widest">Documentation</div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3 w-4 h-4 text-(--text-muted) pointer-events-none" />
            <input
              type="text"
              id="manualSearchInput"
              placeholder="Search documentation..."
              autoComplete="off"
              className="bg-(--bg-elevated) border border-(--border-main) text-(--text-primary) px-3.5 py-2 pl-9 rounded-xl text-xs w-60 focus:outline-none focus:border-blue-500 focus:w-80 transition-all duration-300 shadow-xs placeholder:text-(--text-muted)"
            />
            <span className="absolute right-2.5 text-[0.7rem] font-mono bg-(--accent-subtle) text-(--text-muted) px-1.5 py-0.5 rounded border border-(--border-main) pointer-events-none">/</span>
          </div>

          <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 bg-(--bg-elevated) text-(--text-muted) border border-(--border-main) px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-(--accent-subtle) hover:text-(--text-primary) transition-all duration-200 cursor-pointer shadow-xs hover:scale-105 active:scale-95">
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 pt-16">
        {/* Collapsible Sidebar Navigation */}
        <aside className={`shrink-0 w-80 fixed top-16 bottom-0 left-0 bg-(--bg-surface)/95 backdrop-blur-2xl border-r border-(--border-main) overflow-y-auto p-6 z-45 transition-transform duration-300 shadow-xl ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="text-[0.7rem] font-extrabold uppercase tracking-widest text-(--text-muted) mb-3 px-2">Manuals &amp; Guides</div>
          <ul className="list-none flex flex-col gap-1.5">
            <li>
              <button
                onClick={() => setActiveSection('maintenance-manual')}
                className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 border cursor-pointer ${
                  activeSection === 'maintenance-manual'
                    ? 'bg-(--btn-primary-bg) text-(--btn-primary-text) border-transparent shadow-sm'
                    : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-card-hover) border-transparent'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">Maintenance Manual</span>
              </button>
            </li>
          </ul>
        </aside>

        {/* Main Content Body — Dynamic margin based on sidebar state */}
        <main className={`flex flex-col flex-1 min-h-0 bg-(--bg-surface) backdrop-blur-md border border-(--border-main) rounded-2xl p-6 shadow-2xl overflow-y-auto space-y-6 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-80' : 'ml-0'} scroll-smooth`}>
          {activeSection === 'maintenance-manual' && (
            <div className="space-y-6 manual-content-card">
              {/* Document Hero */}
              <section className="bg-(--bg-card) border border-(--border-main) rounded-3xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-(--accent-subtle) border border-(--border-main) text-(--text-primary) rounded-full text-[0.72rem] font-bold uppercase tracking-wider mb-4 shadow-xs">
                  Documentation • PDF &amp; Video Walkthroughs
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-(--text-primary) mb-3 leading-tight">RC-MRO Maintenance Manual</h1>
                <p className="text-(--text-muted) text-base max-w-4xl leading-relaxed">
                  Comprehensive reference guide and video training modules detailing reliability-centered maintenance processes, asset workflows, and operational procedures for RC-MRO.
                </p>
              </section>

              {/* PDF Document Section */}
              <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-(--border-main) pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-red-500/20 text-red-400 rounded-xl border border-red-500/30">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-(--text-primary)">RCMRO_User_Manual.pdf</h2>
                      <p className="text-xs text-(--text-muted)">Master reference document stored locally in assets.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={localManualPdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 bg-(--bg-elevated) hover:bg-(--bg-card-hover) text-(--text-secondary) border border-(--border-main) px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200 no-underline cursor-pointer"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Open Full Screen
                    </a>
                    <a
                      href={localManualPdf}
                      download="RCMRO_User_Manual.pdf"
                      className="inline-flex items-center gap-1.5 bg-(--btn-primary-bg) text-(--btn-primary-text) px-3 py-2 rounded-xl text-xs font-semibold shadow-md transition-all duration-200 no-underline cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </div>
                </div>

                {/* Inline Web PDF Viewer using Object tag with type enforcement */}
                <div className="w-full h-125 bg-(--bg-elevated) rounded-xl border border-(--border-main) overflow-hidden relative flex flex-col items-center justify-center">
                  <object
                    data={`${localManualPdf}#view=FitH&toolbar=1`}
                    type="application/pdf"
                    className="w-full h-full"
                  >
                    <iframe
                      src={`${localManualPdf}#view=FitH`}
                      title="RCMRO User Manual PDF"
                      className="w-full h-full border-0"
                    >
                      <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                        <p className="text-xs text-(--text-muted)">Your browser does not support inline PDF viewing.</p>
                        <a
                          href={localManualPdf}
                          download="RCMRO_User_Manual.pdf"
                          className="bg-(--btn-primary-bg) text-(--btn-primary-text) px-4 py-2 rounded-xl text-xs font-semibold"
                        >
                          Download PDF Instead
                        </a>
                      </div>
                    </iframe>
                  </object>
                </div>
              </div>

              {/* Video Explainer Section */}
              <div className="bg-(--bg-card) border border-(--border-main) rounded-2xl p-6 space-y-6 shadow-xl">
                <div className="flex items-center gap-3 border-b border-(--border-main) pb-4">
                  <div className="p-2.5 bg-red-600/20 text-red-500 rounded-xl border border-red-600/30">
                    <PlayCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-(--text-primary)">Video Walkthroughs &amp; Explainer Guides</h2>
                    <p className="text-xs text-(--text-muted)">Watch the official video series explaining the maintenance manual and operational workflows.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Video 1 */}
                  <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl overflow-hidden flex flex-col shadow-lg transition-transform duration-300 hover:-translate-y-1">
                    <div className="relative aspect-video bg-(--bg-elevated) flex items-center justify-center">
                      <iframe
                        src="https://www.youtube.com/embed/tRyyGy-f0yw"
                        title="RC-MRO Maintenance Manual Explainer 1"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div className="text-[0.68rem] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" /> Video Module 1
                        </div>
                        <h3 className="text-xs font-bold text-(--text-primary) leading-snug">Maintenance Manual Overview &amp; Setup</h3>
                      </div>
                      <a
                        href="https://youtu.be/tRyyGy-f0yw"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-(--bg-elevated) hover:bg-(--bg-card-hover) text-(--text-secondary) border border-(--border-main) py-2 rounded-xl text-xs font-semibold transition-all no-underline"
                      >
                        Watch on YouTube
                        <ExternalLink className="w-3.5 h-3.5 text-(--text-muted)" />
                      </a>
                    </div>
                  </div>

                  {/* Video 2 */}
                  <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl overflow-hidden flex flex-col shadow-lg transition-transform duration-300 hover:-translate-y-1">
                    <div className="relative aspect-video bg-(--bg-elevated) flex items-center justify-center">
                      <iframe
                        src="https://www.youtube.com/embed/gGbIYiy9XiI"
                        title="RC-MRO Maintenance Manual Explainer 2"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div className="text-[0.68rem] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" /> Video Module 2
                        </div>
                        <h3 className="text-xs font-bold text-(--text-primary) leading-snug">Operational Workflows &amp; PM Schedules</h3>
                      </div>
                      <a
                        href="https://youtu.be/gGbIYiy9XiI"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-(--bg-elevated) hover:bg-(--bg-card-hover) text-(--text-secondary) border border-(--border-main) py-2 rounded-xl text-xs font-semibold transition-all no-underline"
                      >
                        Watch on YouTube
                        <ExternalLink className="w-3.5 h-3.5 text-(--text-muted)" />
                      </a>
                    </div>
                  </div>

                  {/* Video 3 */}
                  <div className="bg-(--bg-surface) border border-(--border-main) rounded-2xl overflow-hidden flex flex-col shadow-lg transition-transform duration-300 hover:-translate-y-1">
                    <div className="relative aspect-video bg-(--bg-elevated) flex items-center justify-center">
                      <iframe
                        src="https://www.youtube.com/embed/RaUm5HWx-qQ"
                        title="RC-MRO Maintenance Manual Explainer 3"
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    </div>
                    <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                      <div>
                        <div className="text-[0.68rem] font-bold text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <PlayCircle className="w-3.5 h-3.5" /> Video Module 3
                        </div>
                        <h3 className="text-xs font-bold text-(--text-primary) leading-snug">Reliability, FMEA &amp; Best Practices</h3>
                      </div>
                      <a
                        href="https://youtu.be/RaUm5HWx-qQ"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 bg-(--bg-elevated) hover:bg-(--bg-card-hover) text-(--text-secondary) border border-(--border-main) py-2 rounded-xl text-xs font-semibold transition-all no-underline"
                      >
                        Watch on YouTube
                        <ExternalLink className="w-3.5 h-3.5 text-(--text-muted)" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Back to Top Button */}
      <button id="btnBackToTop" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-7 right-7 w-11.5 h-11.5 rounded-2xl bg-(--btn-primary-bg) text-(--btn-primary-text) border border-white/20 flex items-center justify-center cursor-pointer shadow-2xl opacity-0 invisible transition-all duration-300 z-40 hover:-translate-y-1.5 hover:scale-105 active:scale-95">
        <ArrowLeft className="w-5 h-5 rotate-90" />
      </button>
    </div>
  );
}

export default Manual;