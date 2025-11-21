import React from "react";
import { Clock } from "lucide-react";


const ComingSoon = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="text-center p-6">
        <div className="flex justify-center mb-6">
          <img
            src="https://www.freepik.com/premium-vector/poster-with-words-coming-soon_373544756.htm#fromView=keyword&page=1&position=9&uuid=daa2ccfa-48ac-4301-ad85-561547cc04b5&query=Coming+soon"
            alt="Coming Soon Illustration"
            className="rounded-2xl shadow-lg w-full max-w-md object-cover animate-pulse"
          />
        </div>
        <h1 className="text-5xl font-extrabold text-white drop-shadow-lg mb-4">
         Coming Soon
        </h1>
        <p className="text-lg text-white/90 max-w-md mx-auto">
          We’re working hard to bring you something amazing. Stay tuned!
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-white/80">
          <Clock className="w-5 h-5 animate-spin-slow" />
          <span className="italic">Launching very soon...</span>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
