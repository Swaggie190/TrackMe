import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        {/* Logo/Brand */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary-600">TrackMe</h1>
          <p className="text-gray-500 mt-2">Time Tracking Made Simple</p>
        </div>
        
        {/* Loading spinner */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
        
        {/* Loading message */}
        <p className="text-gray-600 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;