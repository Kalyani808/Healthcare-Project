import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../../components/common/Button';
import { FaHeartbeat, FaHome } from 'react-icons/fa';

const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex flex-col items-center justify-center p-4 text-center space-y-6">
      <div className="w-20 h-20 rounded-3xl bg-health-50 text-health-500 flex items-center justify-center text-4xl shadow-md">
        <FaHeartbeat className="animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-800">404 — Page Not Found</h1>
      <p className="text-slate-500 text-sm max-w-md">
        The health portal page you are searching for does not exist or has been moved to a new address.
      </p>
      <Link to="/">
        <Button variant="primary" size="lg" icon={FaHome}>
          Return to Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
