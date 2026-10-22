import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const redirect = searchParams.get('redirect') || '/';

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await login(email, password);
            toast.success('Welcome back!');
            navigate(redirect);
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex" data-testid="login-page">
            {/* Left Panel - Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img 
                    src="https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1200"
                    alt="Fashion"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-charcoal/50 to-transparent"></div>
                <div className="absolute bottom-20 left-12 text-white max-w-md">
                    <h2 className="font-heading text-4xl mb-4">Welcome Back to Jaridar</h2>
                    <p className="text-white/80">
                        Sign in to access your wishlist, track orders, and enjoy a personalized shopping experience.
                    </p>
                </div>
            </div>

            {/* Right Panel - Form (Beige Panel) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs"
                >
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-blush flex items-center justify-center">
                            <span className="font-heading text-xl text-white font-semibold">J</span>
                        </div>
                        <div>
                            <h1 className="font-heading text-xl text-charcoal font-black">JARIDAR</h1>
                            <p className="text-xs text-[#8E6F2C] uppercase tracking-widest font-semibold">Fashion Couture</p>
                        </div>
                    </Link>

                    <h2 className="font-heading text-3xl text-charcoal mb-2 font-bold">Sign In</h2>
                    <p className="text-[#4B5563] mb-8 text-xs">Welcome back! Please enter your details.</p>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative mt-1">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="login-email"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative mt-1">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    className="pl-10 pr-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="login-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-xs text-[#4B5563]">
                                <input type="checkbox" className="rounded border-[#E5E7EB]" />
                                Remember me
                            </label>
                            <a href="#" className="text-xs text-rose hover:underline">Forgot password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                            data-testid="login-submit"
                        >
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-xs text-[#4B5563]">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-rose font-medium hover:underline">
                            Sign up
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            await register(name, email, password, phone || null);
            toast.success('Account created successfully!');
            navigate('/');
        } catch (error) {
            toast.error(error.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex" data-testid="register-page">
            {/* Left Panel - Form (Beige Panel) */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white p-8 md:p-10 rounded-2xl border border-[#E5E7EB] shadow-xs"
                >
                    <Link to="/" className="flex items-center gap-2 mb-8">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose to-blush flex items-center justify-center">
                            <span className="font-heading text-xl text-white font-semibold">J</span>
                        </div>
                        <div>
                            <h1 className="font-heading text-xl text-charcoal font-black">JARIDAR</h1>
                            <p className="text-xs text-[#8E6F2C] uppercase tracking-widest font-semibold">Fashion Couture</p>
                        </div>
                    </Link>

                    <h2 className="font-heading text-3xl text-charcoal mb-2 font-bold">Create Account</h2>
                    <p className="text-[#4B5563] mb-8 text-xs">Join us for exclusive access to new collections and offers.</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <div className="relative mt-1">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="register-name"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="email">Email</Label>
                            <div className="relative mt-1">
                                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="register-email"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="phone">Phone Number (Optional)</Label>
                            <div className="relative mt-1">
                                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="10-digit number"
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                    data-testid="register-phone"
                                />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="password">Password</Label>
                            <div className="relative mt-1">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Create a password"
                                    className="pl-10 pr-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="register-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4B5563]"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <div className="relative mt-1">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4B5563]" />
                                <Input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm your password"
                                    className="pl-10 bg-white border-[#E5E7EB]"
                                    required
                                    data-testid="register-confirm-password"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full"
                            data-testid="register-submit"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center mt-8 text-xs text-[#4B5563]">
                        Already have an account?{' '}
                        <Link to="/login" className="text-rose font-medium hover:underline">
                            Sign in
                        </Link>
                    </p>
                </motion.div>
            </div>

            {/* Right Panel - Image */}
            <div className="hidden lg:block lg:w-1/2 relative">
                <img 
                    src="https://images.unsplash.com/photo-1594463750939-ebb28c3f7f75?w=1200"
                    alt="Fashion"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-charcoal/50 to-transparent"></div>
                <div className="absolute bottom-20 right-12 text-white max-w-md text-right">
                    <h2 className="font-heading text-4xl mb-4">Join the Jaridar Family</h2>
                    <p className="text-white/80">
                        Get early access to new collections, exclusive offers, and personalized style recommendations.
                    </p>
                </div>
            </div>
        </div>
    );
};

export { LoginPage, RegisterPage };
