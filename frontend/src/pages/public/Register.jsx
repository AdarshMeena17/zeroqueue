import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { IconButton } from '../../components/ui/IconButton';
import { getErrorMessage } from '../../utils/errors';

export default function Register() {
  usePageTitle('Create account');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      // The backend owns the role: public registration always creates a regular user.
      await register(name, email, password);
      navigate('/app');
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to create account.'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="t-label">Get started</p>
      <h1 className="t-page mt-3">Take your place.</h1>
      <p className="t-body mt-3">Create an account to join queues and follow them live.</p>

      <form onSubmit={handleSubmit} className="mt-10 space-y-5">
        {error && (
          <div role="alert" className="rounded-md border border-danger/40 bg-danger/10 px-3.5 py-3 text-sm text-danger">
            {error}
          </div>
        )}
        <Input label="Full name" type="text" autoComplete="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} required />
        <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          label="Password"
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          placeholder="Choose a password"
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
          Create account
        </Button>
      </form>

      <p className="t-meta mt-8">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-text-primary underline decoration-border-strong underline-offset-4 transition-colors hover:decoration-signal">
          Sign in
        </Link>
      </p>
    </div>
  );
}
