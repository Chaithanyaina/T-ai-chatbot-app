import React, { useState } from 'react';
import { useSignUpEmailPassword } from '@nhost/react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { Toaster, toast } from 'react-hot-toast';
import { MailCheck, ArrowRight } from 'lucide-react';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignedUp, setIsSignedUp] = useState(false);

  const { signUpEmailPassword, isLoading, isError, error } = useSignUpEmailPassword();

  const handleSignUp = async (e) => {
    e.preventDefault();

    try {
      const { isSuccess, needsEmailVerification, error: signUpError } =
        await signUpEmailPassword(email, password, {
          displayName: email.split('@')[0],
        });

      if (isSuccess || needsEmailVerification) {
        setIsSignedUp(true);
      } else if (signUpError) {
        toast.error(signUpError.message || 'An unknown error occurred.');
      }
    } catch (err) {
      toast.error('Something went wrong during signup.');
    }
  };

  // Success message screen
  if (isSignedUp) {
    return (
      <AuthLayout title="One Last Step...">
        <div className="text-center">
          <MailCheck className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-4 text-2xl font-bold text-foreground">
            Please verify your email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We've sent a verification link to <strong>{email}</strong>.  
            Please check your inbox and spam folder to complete your registration.
          </p>
          <div className="mt-6">
            <Link to="/sign-in" className="font-medium text-primary hover:text-primary/80">
              Return to Sign In
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  // Signup form screen
  return (
    <AuthLayout
      title="Create Your Subspace Pro Account"
      subtitle="Experience the future of conversation with an advanced AI assistant."
    >
      <Toaster />
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-foreground">
          Create Account
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/sign-in" className="font-medium text-primary hover:text-primary/80">
            Sign In
          </Link>
        </p>
      </div>

      <form onSubmit={handleSignUp} className="space-y-6">
        {isError && (
          <div className="p-3 bg-red-500/10 text-red-400 rounded-md border border-red-500/20 text-sm">
            {error?.message || 'An unknown error occurred.'}
          </div>
        )}
        <div className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition"
            placeholder="Email address"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-input border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-ring transition"
            placeholder="Password"
          />
        </div>
        <div>
          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent text-sm font-semibold rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary disabled:opacity-50 transition-all duration-300"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
            <ArrowRight
              className={`h-4 w-4 transition-transform duration-300 ${
                isLoading ? '' : 'group-hover:translate-x-1'
              }`}
            />
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default SignUp;
