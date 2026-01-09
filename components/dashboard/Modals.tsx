import React from 'react';
import { Button } from '../UI';
import { RefreshCw, X, Info, Settings, Download, Upload, AlertTriangle, Loader2, Globe, Search, Check, FileJson, HelpCircle, Files } from 'lucide-react';
import { TOPICS } from '../../data/topics';
import { UserState } from '../../types';

export const ResetMenuModal: React.FC<{
  resetMenuTopic: {id: string, name: string} | null;
  userState: UserState;
  onResetConfirm: () => void;
  onCancel: () => void;
}> = ({ resetMenuTopic, userState, onResetConfirm, onCancel }) => {
  if (!resetMenuTopic) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <div className="flex items-center gap-3 mb-4 text-gray-800">
          <div className="bg-gray-100 p-3 rounded-full text-gray-600">
            <RefreshCw size={24} />
          </div>
          <h3 className="text-xl font-bold">Manage Topic</h3>
        </div>
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">{TOPICS.find(t => t.id === resetMenuTopic.id)?.icon}</div>
          <div className="font-bold text-lg text-gray-800">{resetMenuTopic.name}</div>
          <div className="text-sm text-gray-500">Current Level: {userState.topicLevels?.[resetMenuTopic.id] || 0}</div>
        </div>
        <div className="space-y-3">
          <Button variant="danger" fullWidth onClick={onResetConfirm} className="flex items-center justify-center gap-2">
            <RefreshCw size={16} /> Reset Progress
          </Button>
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
        </div>
        <div className="text-xs text-center text-gray-400 mt-4">
          This will reset your level for this topic to 0.
        </div>
      </div>
    </div>
  );
};

export const AboutModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-3 mb-6 text-duo-green">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Info size={32} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">About Gemolingo</h3>
        </div>
        <div className="space-y-4 text-gray-600 leading-relaxed">
          <p><strong>Gemolingo</strong> is a next-generation language learning app powered by Google's Gemini API.</p>
          <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-100">
            <h4 className="font-bold text-gray-800 mb-2">Key Features:</h4>
            <ul className="list-disc pl-4 space-y-1 text-sm">
              <li><strong>AI-Generated Lessons:</strong> Infinite, unique content for every topic.</li>
              <li><strong>Smart Pronunciation:</strong> Text-to-speech powered by advanced AI models.</li>
              <li><strong>Offline Mode:</strong> Download topics to learn anywhere.</li>
              <li><strong>Gamification:</strong> Earn XP, maintain streaks, and climb the leaderboard.</li>
            </ul>
          </div>
          <p className="text-sm">Our mission is to make language learning accessible, personalized, and fun using the latest advancements in Artificial Intelligence.</p>
          <div className="text-center pt-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Powered By</div>
            <div className="font-black text-gray-300 text-xl mt-1">Google Gemini</div>
          </div>
        </div>
        <div className="mt-8">
          <Button fullWidth onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC<{
  onClose: () => void;
  onExportLessons: () => void;
  onImportLessonsFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ onClose, onExportLessons, onImportLessonsFile }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-3 mb-6 text-gray-700">
          <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
            <Settings size={32} />
          </div>
          <h3 className="text-2xl font-bold text-gray-800">Data Settings</h3>
        </div>
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100">
            <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <Download size={18} /> Export Lessons
            </h4>
            <p className="text-sm text-blue-700 mb-4">
              Download all offline lesson data as a JSON file. Useful for backups.
            </p>
            <Button fullWidth variant="secondary" onClick={onExportLessons}>
              Export Data
            </Button>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border-2 border-green-100">
            <h4 className="font-bold text-green-900 mb-2 flex items-center gap-2">
              <Upload size={18} /> Import Lessons
            </h4>
            <p className="text-sm text-green-700 mb-4">
              Restore lesson data from a JSON file. This will merge with your existing data.
            </p>
            <label className="w-full">
              <div className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-2xl text-center border-b-4 border-green-700 active:border-b-0 active:translate-y-1 cursor-pointer transition-all">
                Import Data
              </div>
              <input type="file" accept=".json" className="hidden" onChange={onImportLessonsFile} />
            </label>
          </div>
        </div>
        <div className="mt-8">
          <Button fullWidth variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export const DownloadConfirmModal: React.FC<{
  count: number;
  difficulty: string;
  onCancel: () => void;
  onConfirm: () => void;
}> = ({ count, difficulty, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <div className="flex items-center gap-3 mb-4 text-gray-800">
          <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-xl font-bold">Download All?</h3>
        </div>
        <p className="text-gray-600 mb-2 leading-relaxed">
          You are about to download <strong>{count}</strong> lessons for <strong>{difficulty}</strong> level.
        </p>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-6">
          This may take a few minutes.
        </p>
        <div className="flex gap-4">
          <Button variant="ghost" fullWidth onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" fullWidth onClick={onConfirm}>
            Start Download
          </Button>
        </div>
      </div>
    </div>
  );
};

export const BulkDownloadProgressModal: React.FC<{
  progress: { current: number, total: number };
  onCancel: () => void;
}> = ({ progress, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-pop-in">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl text-center relative">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={24} />
        </button>
        <div className="mb-6 flex justify-center">
          <Loader2 size={48} className="text-duo-blue animate-spin" />
        </div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Downloading...</h3>
        <p className="text-gray-500 mb-6">Please keep the app open.</p>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2 overflow-hidden">
          <div
            className="bg-duo-blue h-full transition-all duration-300 rounded-full"
            style={{ width: `${(progress.current / progress.total) * 100}%` }}
          />
        </div>
        <div className="text-sm font-bold text-gray-400">
          {progress.current} / {progress.total} Lessons
        </div>
      </div>
    </div>
  );
};

export const LanguageSelectorModal: React.FC<{
  allLanguages: any[];
  currentLanguage: string;
  onChangeLanguage: (code: string) => void;
  onClose: () => void;
  onShowImportHelp: () => void;
  onImportLanguage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBulkImportLanguage: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ allLanguages, currentLanguage, onChangeLanguage, onClose, onShowImportHelp, onImportLanguage, onBulkImportLanguage }) => {
  const [languageSearchQuery, setLanguageSearchQuery] = React.useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Globe size={20} className="text-duo-blue" /> Select Language
          </h3>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
            <X size={24} />
          </button>
        </div>
        <div className="p-4 border-b border-gray-50">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search languages..."
              value={languageSearchQuery}
              onChange={(e) => setLanguageSearchQuery(e.target.value)}
              className="w-full bg-gray-100 rounded-xl py-2 pl-9 pr-4 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-gray-200"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">All Languages</div>
          {allLanguages
            .filter(lang =>
              lang.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
              lang.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
            )
            .map(lang => (
              <button
                key={lang.code}
                onClick={() => { onChangeLanguage(lang.code); onClose(); }}
                className={`
                  w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                  ${currentLanguage === lang.code ? 'border-duo-blue bg-blue-50 text-duo-blue' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}
                `}
              >
                <span className="text-4xl">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <div className="font-bold text-lg">{lang.name}</div>
                  {currentLanguage === lang.code && <div className="text-xs font-bold uppercase">Active</div>}
                </div>
                {currentLanguage === lang.code && <Check size={24} strokeWidth={3} />}
              </button>
            ))}
          {allLanguages.filter(lang =>
            lang.name.toLowerCase().includes(languageSearchQuery.toLowerCase()) ||
            lang.code.toLowerCase().includes(languageSearchQuery.toLowerCase())
          ).length === 0 && (
              <div className="text-center py-8 text-gray-400 font-bold">No languages found</div>
            )}
        </div>
        <div className="p-4 border-t border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-500">
              <FileJson size={20} />
              <span className="text-sm font-bold">Custom Language</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onShowImportHelp} className="p-2 text-gray-400 hover:text-duo-blue hover:bg-blue-50 rounded-lg transition-colors" title="Help">
                <HelpCircle size={20} />
              </button>
              <label className="flex items-center gap-2 px-4 py-2 bg-blue-50 border-2 border-blue-100 hover:border-duo-blue text-duo-blue rounded-xl cursor-pointer font-bold text-sm transition-colors">
                <Files size={16} /> Import All
                <input type="file" accept=".json" multiple className="hidden" onChange={onBulkImportLanguage} />
              </label>
              <label className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 hover:border-duo-blue text-duo-blue rounded-xl cursor-pointer font-bold text-sm transition-colors">
                <Upload size={16} /> Import
                <input type="file" accept=".json" className="hidden" onChange={onImportLanguage} />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ImportHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors">
          <X size={24} />
        </button>
        <div className="flex items-center gap-3 mb-4 text-duo-blue">
          <FileJson size={32} />
          <h3 className="text-xl font-bold text-gray-800">Import Language</h3>
        </div>
        <p className="text-gray-600 mb-4 leading-relaxed text-sm">
          Add custom languages by importing a JSON file with the following format:
        </p>
        <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm border-2 border-gray-100 mb-6 relative group">
          <div className="text-gray-400 mb-2 text-[10px] font-bold uppercase tracking-wider select-none flex justify-between">
            <span>example.json</span>
          </div>
          <pre className="text-gray-700 whitespace-pre-wrap break-all">
            {`{
  "code": "fr",
  "name": "French",
  "flag": "🇫🇷"
}`}
          </pre>
        </div>
        <Button fullWidth onClick={onClose}>Got it</Button>
      </div>
    </div>
  );
};