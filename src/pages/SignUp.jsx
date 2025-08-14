import React, { useState } from 'react';
import { useSignUpEmailPassword } from '@nhost/react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Toaster, toast } from 'react-hot-toast';
import { MailCheck } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // State to show the success message
  const [isSignedUp, setIsSignedUp] = useState(false);

  const { signUpEmailPassword, isLoading, isError, error } = useSignUpEmailPassword();

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    const { isSuccess, needsEmailVerification, error: signUpError } = 
      await signUpEmailPassword(email, password, {
        displayName: email.split('@')[0],
      });

    if (isSuccess || needsEmailVerification) {
      setIsSignedUp(true); // Show success message
    } else if (signUpError) {
      toast.error(signUpError.message || 'An unknown error occurred.');
    }
  };
  
  // Success screen after signup
  if (isSignedUp) {
    return (
      <AuthLayout>
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Please verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent a verification link to <strong>{email}</strong>.
          </p>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-500">
            Please check your inbox (and your spam folder!) and click the link to activate your account.
          </p>
          <div className="mt-6">
            <Link 
              to="/sign-in" 
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Return to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Signup form
  return (
    <AuthLayout>
      <Toaster/>
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          Create Your Account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Or{' '}
          <Link 
            to="/sign-in" 
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            sign in to your existing account
          </Link>
        </p>
      </div>
      <form onSubmit={handleSignUp} className="mt-8 space-y-6">
        {isError && (
          <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-md border border-red-500/20">
            {error?.message || 'An unknown error occurred.'}
          </div>
        )}
        <div className="space-y-4 rounded-md">
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
            placeholder="Email address" 
          />
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition" 
            placeholder="Password" 
          />
        </div>
        <div>
          <button 
            type="submit" 
            disabled={isLoading} 
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 dark:disabled:bg-blue-800 transition-colors"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
