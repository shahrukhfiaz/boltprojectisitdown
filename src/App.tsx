import React, { useState } from 'react';
import { Globe2, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

function App() {
  const [url, setUrl] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<'up' | 'down' | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let processedUrl = url.trim();
    
    // Add https:// if missing
    if (!processedUrl.startsWith('http://') && !processedUrl.startsWith('https://')) {
      processedUrl = 'https://' + processedUrl;
    }
    
    // Add .com if no TLD
    if (!processedUrl.includes('.')) {
      processedUrl += '.com';
    }

    setIsChecking(true);
    
    try {
      // Simulate checking (in real app, this would be an API call)
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResult(Math.random() > 0.5 ? 'up' : 'down');
    } catch (error) {
      setResult('down');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center">
          <div className="mb-8 flex items-center">
            <Globe2 className="h-12 w-12 mr-4" />
            <h1 className="text-4xl font-bold">Is It Down?</h1>
          </div>
          
          <div className="w-full max-w-2xl">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter a website (e.g. google.com)"
                  className="w-full px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isChecking || !url}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-500 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowRight className="h-6 w-6" />
                </button>
              </div>
            </form>

            {isChecking && (
              <div className="mt-8 text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                <p className="text-xl">Checking website status...</p>
              </div>
            )}

            {result && !isChecking && (
              <div className="mt-8">
                <div className={`p-6 rounded-lg ${
                  result === 'up' 
                    ? 'bg-green-500/20 border border-green-500/30' 
                    : 'bg-red-500/20 border border-red-500/30'
                }`}>
                  <div className="flex items-center justify-center gap-4">
                    {result === 'up' ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-green-500" />
                        <p className="text-2xl font-medium">It's just you! The website is up.</p>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-8 w-8 text-red-500" />
                        <p className="text-2xl font-medium">It's not just you! The website appears to be down.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12">
              <h2 className="text-xl font-semibold mb-4">Popular Websites</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['Google', 'Facebook', 'Twitter', 'Instagram'].map((site) => (
                  <button
                    key={site}
                    onClick={() => setUrl(site.toLowerCase())}
                    className="p-4 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors text-center"
                  >
                    {site}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

export default App