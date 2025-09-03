
import React from 'react';
import { Link } from 'react-router-dom';

const RegisterPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary-600 mb-2">TrackMe</h1>
          <h2 className="text-2xl font-bold text-gray-900">Create your account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
              Sign in
            </Link>
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <div className="text-center text-gray-500">
            <p>🚧 Registration form coming next...</p>
            <p className="text-sm mt-2">Email, password, and display name fields</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;