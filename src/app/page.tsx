import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold mb-6">Travel Tagger</h1>
          <p className="text-xl mb-8">
            Plan your travels by placing pins on an interactive map. Organize your trips, save locations, and keep track of your adventures.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/signin" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-full transition-colors"
            >
              Get Started
            </Link>
            <Link 
              href="/dashboard" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-6 rounded-full transition-colors"
            >
              View Demo
            </Link>
          </div>
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Map Your Trips</h2>
              <p>Create custom maps with pins for all the places you want to visit or have visited.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Organize Locations</h2>
              <p>Add details to your pins including dates, categories, and personal notes.</p>
            </div>
            <div className="p-6 border border-gray-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Share Your Plans</h2>
              <p>Collaborate with friends and family on trip planning with shareable maps.</p>
            </div>
          </div>
        </div>
      </main>
      
      <footer className="py-6 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} Travel Tagger. All rights reserved.</p>
      </footer>
    </div>
  );
}
