import {  } from "lucide-react";

export const Subjects = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage subjects and curriculum.</p>
      </div>
      <div className="card">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📋</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Coming Soon</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
              This module is being implemented. The backend API for Subject Management is fully functional.
            </p>
          </div>
        </div>
      </div>
      
    </div>
  );
};
