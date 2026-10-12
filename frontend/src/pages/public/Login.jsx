import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { getErrorMessage } from '../../utils/errors';

const HOME = { admin: '/admin', staff: '/staff', user: '/app' };

export default function Login() {
  usePageTitle('Sign in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const res = await login(email, password);
      navigate(HOME[res?.data?.role] || '/app');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to sign in.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="t-label">Welcome back</p>
      <h1 className="t-page mt-3">Sign in to your queue.</h1>
      <p className="t-body mt-3">Pick up exactly where your place in line left off.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {error && (
          <div role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="Your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          trailing={
            <IconButton label={show ? 'Hide password' : 'Show password'} onClick={() => setShow((s) => !s)} className="h-9 w-9">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </IconButton>
          }
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isLoading}>
          Sign in
        </Button>
      </form>

      <p className="t-meta mt-8">
        New to QueueZero?{' '}
        <Link to="/register" className="font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-signal">
          Create an account
        </Link>
      </p>
    </div>
  );
}
