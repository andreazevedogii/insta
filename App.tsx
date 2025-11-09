

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { GeneratedArtwork, Page, GenerationMode } from './types';
import * as geminiService from './services/geminiService';
import { HomeIcon, SparklesIcon, GalleryIcon, UploadIcon, SaveIcon, InstagramIcon, XIcon, TrashIcon, RefreshCwIcon, LogoutIcon } from './components/icons';

// --- Helper Components (defined outside main App component) ---

const Spinner = () => (
    <div className="border-4 border-t-4 border-gray-200 border-t-yellow-400 rounded-full w-12 h-12 animate-spin"></div>
);

interface ImageUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  label: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileSelect, selectedFile, label }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-3xl">
        <div className="space-y-1 text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-yellow-500 hover:text-yellow-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-yellow-500">
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          {selectedFile ? (
            <p className="text-xs text-gray-500">{selectedFile.name}</p>
          ) : (
            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
          )}
        </div>
      </div>
    </div>
  );
};


interface GenerationResultModalProps {
    result: GeneratedArtwork;
    onClose: () => void;
    onSave: (artwork: GeneratedArtwork) => void;
    onGenerateAgain: () => void;
    isLoggedIn: boolean;
}

const GenerationResultModal: React.FC<GenerationResultModalProps> = ({ result, onClose, onSave, onGenerateAgain, isLoggedIn }) => {
    const [isSaved, setIsSaved] = useState(false);
    
    const handleSave = () => {
        onSave(result);
        setIsSaved(true);
    };
    
    const handleShare = () => {
        alert("Sharing to Instagram requires a secure server-side implementation to protect credentials. This functionality is for UI demonstration purposes only.");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative animate-slide-up">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
                    <XIcon className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold text-center mb-6">Your ArtVibe Creation</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                    {result.sourceImage && (
                        <div className="text-center">
                            <h3 className="font-semibold mb-2">Original</h3>
                            <img src={result.sourceImage} alt="Original" className="rounded-2xl w-full h-auto object-contain max-h-96" />
                        </div>
                    )}
                    <div className={`text-center ${!result.sourceImage && 'md:col-span-2'}`}>
                        <h3 className="font-semibold mb-2">Generated Art</h3>
                        <img src={result.generatedImage} alt="Generated Art" className="rounded-2xl w-full h-auto object-contain max-h-96" />
                    </div>
                </div>
                <p className="text-center text-sm text-gray-500 mt-4 italic">Prompt: "{result.prompt}"</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <button onClick={handleSave} disabled={isSaved} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all duration-300 ${isSaved ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'}`}>
                        <SaveIcon className="w-5 h-5" /> {isSaved ? 'Saved!' : 'Save to Gallery'}
                    </button>
                    <button onClick={handleShare} disabled={!isLoggedIn} title={isLoggedIn ? "Share your creation" : "Please log in to share"} className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-white transition-all duration-300 ${!isLoggedIn ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 hover:opacity-90'}`}>
                        <InstagramIcon className="w-5 h-5" /> Share on Instagram
                    </button>
                    <button onClick={onGenerateAgain} className="flex items-center gap-2 px-6 py-3 rounded-full font-semibold border-2 border-black text-black hover:bg-gray-100 transition-colors">
                        <RefreshCwIcon className="w-5 h-5" /> Generate Again
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Page Components ---

const HomePage = ({ onGenerateClick }: { onGenerateClick: () => void }) => (
  <div className="flex flex-col items-center justify-center text-center h-full px-4">
    <SparklesIcon className="w-16 h-16 text-[#FFD300] mb-4" />
    <h1 className="text-5xl md:text-7xl font-bold tracking-tight">ArtVibe</h1>
    <p className="mt-4 text-lg md:text-xl text-gray-600 max-w-2xl">
      Transform your space with AI-generated art. Create, edit, and discover designs that perfectly match your vibe.
    </p>
    <button onClick={onGenerateClick} className="mt-10 px-10 py-4 bg-[#FFD300] text-black font-bold text-lg rounded-full shadow-[0_0_15px_rgba(255,211,0,0.6)] hover:shadow-[0_0_25px_rgba(255,211,0,0.8)] hover:scale-105 transition-all duration-300 ease-in-out">
      Generate Art Now
    </button>
  </div>
);

const GeneratePage = ({ onGenerationComplete }: { onGenerationComplete: (result: GeneratedArtwork) => void }) => {
  const [mode, setMode] = useState<GenerationMode>('fromRoom');
  const [prompt, setPrompt] = useState('');
  const [roomImage, setRoomImage] = useState<File | null>(null);
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isGenerateDisabled = useMemo(() => {
    if (isLoading) return true;
    if (!prompt) return true;
    if (mode === 'fromRoom' && !roomImage) return true;
    if (mode === 'edit' && !editImageFile) return true;
    return false;
  }, [isLoading, prompt, mode, roomImage, editImageFile]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
        let generatedImage: string | undefined;
        let sourceImage: string | undefined;

        if (mode === 'fromRoom' && roomImage) {
            generatedImage = await geminiService.generateArtForRoom(roomImage, prompt);
            sourceImage = URL.createObjectURL(roomImage);
        } else if (mode === 'edit' && editImageFile) {
            generatedImage = await geminiService.editImage(editImageFile, prompt);
            sourceImage = URL.createObjectURL(editImageFile);
        } else if (mode === 'fromText') {
            generatedImage = await geminiService.generateImageFromText(prompt);
        }

        if (generatedImage) {
            onGenerationComplete({
                id: crypto.randomUUID(),
                generatedImage,
                sourceImage,
                prompt,
                mode,
                timestamp: Date.now()
            });
        } else {
             throw new Error("Generation failed to return an image.");
        }
    } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
        setIsLoading(false);
    }
  };

  const ModeButton: React.FC<{ currentMode: GenerationMode; targetMode: GenerationMode; children: React.ReactNode }> = ({ currentMode, targetMode, children }) => (
    <button
      onClick={() => setMode(targetMode)}
      className={`px-4 py-2 rounded-full font-semibold transition-colors ${currentMode === targetMode ? 'bg-black text-white' : 'bg-gray-200 text-black hover:bg-gray-300'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="w-full max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-3xl font-bold text-center mb-2">Create Your Art</h2>
      <p className="text-center text-gray-500 mb-8">Choose a method to bring your vision to life.</p>
      
      <div className="flex justify-center gap-4 mb-8">
        <ModeButton currentMode={mode} targetMode="fromRoom">Art for Room</ModeButton>
        <ModeButton currentMode={mode} targetMode="edit">Edit Image</ModeButton>
        <ModeButton currentMode={mode} targetMode="fromText">From Text</ModeButton>
      </div>

      <div className="space-y-6">
        {mode === 'fromRoom' && <ImageUploader onFileSelect={setRoomImage} selectedFile={roomImage} label="1. Upload a photo of your room" />}
        {mode === 'edit' && <ImageUploader onFileSelect={setEditImageFile} selectedFile={editImageFile} label="1. Upload an image to edit" />}
        
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            {mode === 'fromRoom' && '2. Describe the art you envision'}
            {mode === 'edit' && '2. Describe the edits'}
            {mode === 'fromText' && 'Describe the image to create'}
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={
              mode === 'fromRoom' ? "e.g., 'a serene watercolor landscape'" :
              mode === 'edit' ? "e.g., 'add a retro filter and make the sky more dramatic'" :
              "e.g., 'a cyberpunk city street at night, raining'"
            }
            className="w-full p-4 border border-gray-300 rounded-3xl h-32 focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 transition"
            disabled={isLoading}
          />
        </div>

        <button 
          onClick={handleGenerate} 
          disabled={isGenerateDisabled}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#FFD300] text-black font-bold text-lg rounded-full shadow-[0_0_10px_rgba(255,211,0,0.5)] hover:shadow-[0_0_20px_rgba(255,211,0,0.7)] transition-all duration-300 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {isLoading ? <><Spinner /> Generating...</> : <><SparklesIcon /> Generate</>}
        </button>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
      </div>
    </div>
  );
};


const GalleryPage = ({ gallery, setGallery }: { gallery: GeneratedArtwork[], setGallery: React.Dispatch<React.SetStateAction<GeneratedArtwork[]>> }) => {
    const removeFromGallery = (id: string) => {
        setGallery(gallery.filter(item => item.id !== id));
    };

    if (gallery.length === 0) {
        return (
            <div className="text-center py-20">
                <GalleryIcon className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-2 text-2xl font-semibold text-gray-900">Your gallery is empty</h3>
                <p className="mt-1 text-gray-500">Start creating to see your artworks here.</p>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-6xl mx-auto py-8 px-4">
            <h2 className="text-3xl font-bold text-center mb-8">Your Saved Creations</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {gallery.sort((a,b) => b.timestamp - a.timestamp).map(artwork => (
                    <div key={artwork.id} className="group relative overflow-hidden rounded-3xl shadow-lg transition-shadow hover:shadow-xl">
                        <img src={artwork.generatedImage} alt={artwork.prompt} className="w-full h-80 object-cover transition-transform duration-300 group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                           <div className="absolute bottom-0 left-0 p-4 text-white">
                                <p className="font-semibold text-sm line-clamp-2">{artwork.prompt}</p>
                           </div>
                           <button onClick={() => removeFromGallery(artwork.id)} className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm text-white rounded-full p-2 hover:bg-red-500/80 transition-colors">
                                <TrashIcon className="w-5 h-5" />
                           </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// --- Main App Component ---

export default function App() {
  const [page, setPage] = useState<Page>('home');
  const [gallery, setGallery] = useLocalStorage<GeneratedArtwork[]>('artvibe-gallery', []);
  const [result, setResult] = useState<GeneratedArtwork | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>('artvibe-ig-loggedin', false);
  
  // Handle OAuth redirect from Instagram
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    if (code) {
      // In a real app, you'd exchange this code for an access token on your server.
      // For this client-side demo, we'll just consider the presence of a code as a successful login.
      setIsLoggedIn(true);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [setIsLoggedIn]);

  const handleLogin = () => {
    const INSTAGRAM_CLIENT_ID = '778757358530314';
    // IMPORTANT: You must add this exact URI to your Instagram app's "Valid OAuth Redirect URIs"
    // in the Facebook for Developers portal.
    const REDIRECT_URI = window.location.origin + window.location.pathname;
    
    const authUrl = `https://api.instagram.com/oauth/authorize?client_id=${INSTAGRAM_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=user_profile&response_type=code`;
    
    window.location.href = authUrl;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };
  
  const handleGenerationComplete = useCallback((artwork: GeneratedArtwork) => {
    setResult(artwork);
  }, []);
  
  const handleSaveToGallery = useCallback((artwork: GeneratedArtwork) => {
    if (!gallery.some(item => item.id === artwork.id)) {
        setGallery(prev => [artwork, ...prev]);
    }
  }, [gallery, setGallery]);

  const handleCloseResult = useCallback(() => {
    setResult(null);
  }, []);

  const handleGenerateAgain = useCallback(() => {
    setResult(null);
    setPage('generate');
  }, []);
  
  const renderPage = () => {
    switch (page) {
      case 'home':
        return <HomePage onGenerateClick={() => setPage('generate')} />;
      case 'generate':
        return <GeneratePage onGenerationComplete={handleGenerationComplete} />;
      case 'gallery':
        return <GalleryPage gallery={gallery} setGallery={setGallery} />;
      default:
        return <HomePage onGenerateClick={() => setPage('generate')} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white/80 backdrop-blur-sm z-40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setPage('home')}>
            <SparklesIcon className="w-8 h-8 text-[#FFD300]" />
            <span className="text-2xl font-bold tracking-tighter">ArtVibe</span>
        </div>
        <nav className="flex items-center gap-4">
            <button onClick={() => setPage('home')} className={`flex items-center gap-2 p-2 rounded-full transition-colors ${page === 'home' ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>
                <HomeIcon className="w-5 h-5" /> <span className="hidden sm:inline">Home</span>
            </button>
            <button onClick={() => setPage('generate')} className={`flex items-center gap-2 p-2 rounded-full transition-colors ${page === 'generate' ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>
                <SparklesIcon className="w-5 h-5" /> <span className="hidden sm:inline">Generate</span>
            </button>
             <button onClick={() => setPage('gallery')} className={`flex items-center gap-2 p-2 rounded-full transition-colors ${page === 'gallery' ? 'text-black font-semibold' : 'text-gray-500 hover:text-black'}`}>
                <GalleryIcon className="w-5 h-5" /> <span className="hidden sm:inline">Gallery</span>
            </button>
            {isLoggedIn ? (
                 <button onClick={handleLogout} className={`flex items-center gap-2 p-2 rounded-full text-gray-500 hover:text-black transition-colors`}>
                    <LogoutIcon className="w-5 h-5" /> <span className="hidden sm:inline">Logout</span>
                </button>
            ) : (
                <button onClick={handleLogin} className={`flex items-center gap-2 px-4 py-2 rounded-full bg-black text-white font-semibold hover:bg-gray-800 transition-colors`}>
                    <InstagramIcon className="w-5 h-5" /> <span className="hidden sm:inline">Login</span>
                </button>
            )}
        </nav>
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        {renderPage()}
      </main>

      {result && (
        <GenerationResultModal 
            result={result} 
            onClose={handleCloseResult}
            onSave={handleSaveToGallery}
            onGenerateAgain={handleGenerateAgain}
            isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  );
}
