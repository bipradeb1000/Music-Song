import React from "react";

interface MobileFrameProps {
  children: React.ReactNode;
}

export const MobileFrame: React.FC<MobileFrameProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-0 sm:p-4 font-sans text-slate-100 selection:bg-blue-600 selection:text-white">
      {/* Phone Wrapper Shell - invisible on pure small mobile screens, gorgeous bento-mockup on desktops */}
      <div 
        id="phone-wrapper-shell"
        className="w-full h-screen sm:h-[880px] sm:max-w-[420px] bg-slate-900 border-0 sm:border-8 sm:border-slate-800 sm:rounded-[36px] overflow-hidden flex flex-col relative sm:shadow-2xl sm:shadow-blue-900/30 transition-all duration-300"
      >
        {/* Dynamic status bar mock for desktop */}
        <div id="phone-notch-header" className="hidden sm:flex bg-slate-950 h-7 items-center justify-between px-6 text-[11px] text-slate-400 font-mono select-none border-b border-slate-900">
          <span>YOUR</span>
          <div className="w-[110px] h-4 bg-slate-900 rounded-full flex items-center justify-center border border-slate-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse mr-1.5"></span>
            <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Studio Mode</span>
          </div>
          <span>100% 🔋</span>
        </div>

        {/* Content container */}
        <div id="phone-content-body" className="flex-1 overflow-y-auto flex flex-col relative bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
          {children}
        </div>

        {/* Home indicator button bar on desktop */}
        <div id="phone-bottom-notch" className="hidden sm:flex bg-slate-950 h-5 justify-center items-center select-none border-t border-slate-900">
          <div className="w-28 h-1 bg-slate-700 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};
